"""The Run object — the only thing most users will touch.

A ``Run`` is the lifespan of one training script invocation. It owns a unique
id, an output directory under ``~/.siliconworm/runs/<id>/``, a buffered metric
writer that flushes both to local jsonl and (optionally) to a remote ingest
endpoint, and a ``summary`` dict that holds aggregate results.

Usage is intentionally tiny::

    run = siliconworm.init(project="viscount-lm", config={"lr": 3e-4})
    run.log({"train_loss": loss}, step=step)
    run.summary["final_acc"] = 0.987
    run.finish()
"""

from __future__ import annotations

import atexit
import json
import logging
import os
import random
import secrets
import threading
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from .client import IngestClient
from .env import capture as capture_env

logger = logging.getLogger("siliconworm.run")

# Module-level singleton — set by `init()`, cleared by `finish()`.
_current: "Run | None" = None

_FLUSH_THRESHOLD = 64        # records buffered before a forced flush
_FLUSH_INTERVAL_S = 2.0      # seconds between background flushes
_ADJECTIVES = [
    "wise", "brisk", "amber", "velvet", "iron", "feral", "lucent", "noble",
    "tidal", "spiral", "obsidian", "cobalt", "muted", "hollow", "ember",
    "stoic", "fern", "slate", "lyric", "crisp", "vapor", "azure", "ashen",
    "thorn", "polar", "midnight", "saffron", "umbra", "candle",
]
_NOUNS = [
    "sweep", "yak", "comet", "drift", "fern", "owl", "kite", "harbor",
    "lichen", "magnet", "ridge", "orbit", "ember", "fjord", "hare", "spruce",
    "willow", "totem", "delta", "thicket", "amber", "knot", "tundra",
    "cinder", "moth", "vellum", "quarry",
]


# ───────────────────────── id + name helpers ─────────────────────────

def _atomic_write(path: Path, text: str) -> None:
    """Write `text` to `path` atomically via a sibling tmp + os.replace().

    Same dirname so the rename is on the same filesystem (kernel rename(2)
    is atomic in that case). The tmp file gets a pid/thread suffix to keep
    concurrent writers from each other.
    """
    tmp = path.with_suffix(path.suffix + f".tmp.{os.getpid()}.{threading.get_ident():x}")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


# Crockford base32, ULID-style — 10 chars of ms timestamp + 16 chars of random.
_ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def _ulid() -> str:
    now_ms = int(time.time() * 1000)
    rand = secrets.randbits(80)
    # 48-bit ms timestamp → 10 base32 chars
    ts_part = ""
    for _ in range(10):
        ts_part = _ULID_ALPHABET[now_ms & 0x1F] + ts_part
        now_ms >>= 5
    # 80-bit random → 16 base32 chars
    rand_part = ""
    for _ in range(16):
        rand_part = _ULID_ALPHABET[rand & 0x1F] + rand_part
        rand >>= 5
    return ts_part + rand_part


def _generate_name(seed: int | None = None) -> str:
    rng = random.Random(seed)
    adj = rng.choice(_ADJECTIVES)
    noun = rng.choice(_NOUNS)
    suffix = rng.randint(1, 999)
    return f"{adj}-{noun}-{suffix:03d}"


# ───────────────────────── value coercion ─────────────────────────
#
# Architecture: a per-type coercer registry. The first time we see a given
# concrete `type(v)`, we figure out which coercer to use and stash it in a
# dict. Subsequent calls for the same type are a single dict lookup plus a
# function call — no f-string formatting, no isinstance chain. This matters
# because .log() is in the hot path of every training step.
#
# Backends are dispatched by module-name prefix on the class path, so we
# never import torch / numpy / mlx at SDK load time. Users who don't have
# those installed pay zero overhead and zero import cost.

from typing import Callable  # noqa: E402  — kept next to the helpers that use it

_Scalar = float | int | str | bool | None
_Coercer = Callable[[Any], _Scalar]

# Built-in pass-through types — by far the common case.
_PASSTHROUGH_TYPES = (bool, int, float, str, type(None))


def _coerce_passthrough(v: Any) -> _Scalar:
    return v


def _coerce_fallback(v: Any) -> _Scalar:
    try:
        return float(v)
    except Exception:
        return str(v)


def _coerce_torch(v: Any) -> _Scalar:
    # detach() to drop autograd graph, then .item() for 0-d, .mean().item() for nd.
    try:
        t = v.detach()
        if t.ndim == 0:
            return float(t.item())
        return float(t.float().mean().item())
    except Exception:
        return None


def _coerce_numpy(v: Any) -> _Scalar:
    try:
        return float(v.item())
    except Exception:
        try:
            return float(v.mean())
        except Exception:
            return None


def _coerce_mlx(v: Any) -> _Scalar:
    # MLX is lazy — .item() on a 0-d array forces the underlying graph to
    # eval, which is what we want for a logged scalar.  For nd arrays we
    # take the mean (a 0-d array) and item() that.
    try:
        if v.ndim == 0:
            return float(v.item())
        return float(v.mean().item())
    except Exception:
        return None


def _resolve_coercer(t: type) -> _Coercer:
    """Pick a coercer for an unfamiliar type. Called at most once per type."""
    if t in _PASSTHROUGH_TYPES:
        return _coerce_passthrough
    cls_path = f"{t.__module__}.{t.__name__}"
    if cls_path.startswith("torch."):
        return _coerce_torch
    if cls_path.startswith("numpy."):
        return _coerce_numpy
    if cls_path.startswith("mlx."):  # both mlx.core.array and mlx.nn.* etc.
        return _coerce_mlx
    return _coerce_fallback


# Hot-path dispatch table. Populated lazily.
_COERCERS: dict[type, _Coercer] = {t: _coerce_passthrough for t in _PASSTHROUGH_TYPES}


def _coerce_scalar(v: Any) -> _Scalar:
    """Hot path: O(1) dict lookup → cached coercer for type(v)."""
    t = type(v)
    coercer = _COERCERS.get(t)
    if coercer is None:
        coercer = _resolve_coercer(t)
        _COERCERS[t] = coercer
    return coercer(v)


def _normalize_metrics(metrics: dict[str, Any]) -> dict[str, Any]:
    # Dict-comprehension keeps this a single allocation; the per-key cost is
    # the cached coercer call plus a str() on the key.
    return {str(k): _coerce_scalar(v) for k, v in metrics.items()}


# ───────────────────────── summary view ─────────────────────────

class Summary(dict):
    """Dict-like container for final aggregate values.

    Behaves like a regular dict but logs any update through the owning run so
    the summary file on disk stays current. The summary is written eagerly
    rather than buffered — there are usually only a handful of keys.
    """

    def __init__(self, run: "Run") -> None:
        super().__init__()
        self._run = run

    def __setitem__(self, k: str, v: Any) -> None:
        super().__setitem__(k, _coerce_scalar(v))
        self._run._write_summary()

    def update(self, *args, **kwargs) -> None:  # type: ignore[override]
        # Coerce all incoming values, then write once.
        merged = dict(*args, **kwargs)
        for k, v in merged.items():
            super().__setitem__(str(k), _coerce_scalar(v))
        self._run._write_summary()


# ───────────────────────── the Run itself ─────────────────────────

class Run:
    """One training invocation.

    Created by :func:`siliconworm.init`. Owns the local output directory, the
    background flusher, and the optional HTTP ingest client. Safe to use as
    a context manager — exiting calls :meth:`finish` automatically.
    """

    def __init__(
        self,
        project: str,
        *,
        name: str | None = None,
        config: dict[str, Any] | None = None,
        tags: list[str] | None = None,
        group: str | None = None,
        notes: str | None = None,
        job_type: str | None = None,
        dir: str | os.PathLike[str] | None = None,
        api_url: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self.project = project
        self.id = _ulid()
        # Seed the name from the id so two runs in the same ms still differ.
        # (Crockford alphabet includes chars outside python's base-32, so we
        # roll our own seed instead of int(..., 32).)
        self.name = name or _generate_name(
            seed=sum(_ULID_ALPHABET.index(c) << (i * 5) for i, c in enumerate(self.id[-8:]))
        )
        self.config: dict[str, Any] = dict(config or {})
        self.tags: list[str] = list(tags or [])
        self.group = group
        self.notes = notes
        self.job_type = job_type
        self.summary: Summary = Summary(self)

        base = Path(dir) if dir else Path.home() / ".siliconworm" / "runs"
        self.dir: Path = base / self.id
        self.dir.mkdir(parents=True, exist_ok=True)
        self._metrics_path = self.dir / "metrics.jsonl"
        self._summary_path = self.dir / "summary.json"
        self._config_path = self.dir / "config.json"
        self._system_path = self.dir / "system.json"

        self._buf: list[dict[str, Any]] = []
        self._buf_lock = threading.Lock()
        self._auto_step = 0
        self._finished = False
        self._started_at = datetime.now(timezone.utc)
        self._t0 = time.monotonic()
        self._system = capture_env()

        self._client = IngestClient(
            api_url=api_url or os.environ.get("SILICONWORM_API_URL"),
            api_key=api_key or os.environ.get("SILICONWORM_API_KEY"),
        )

        self._write_config()
        self._write_summary()
        _atomic_write(self._system_path, json.dumps(self._system, indent=2, default=str))

        # Background flusher — small and dumb, runs until finish().
        self._stop = threading.Event()
        self._flusher = threading.Thread(
            target=self._flush_loop, name="siliconworm-flusher", daemon=True
        )
        self._flusher.start()

        # Backstop: if the user forgets `.finish()`, the atexit hook flushes.
        atexit.register(self._atexit_finish)

        self._client.post_init(self._init_payload())

        logger.info("siliconworm: %s/%s · run=%s · dir=%s",
                    self.project, self.name, self.id, self.dir)

    # ───────────── public API ─────────────

    @property
    def url(self) -> str:
        """Local URI scheme; a hosted dashboard would substitute its own host."""
        return f"siliconworm://{self.project}/{self.id}"

    def log(
        self,
        metrics: dict[str, Any],
        *,
        step: int | None = None,
        commit: bool | None = None,
    ) -> None:
        """Append a record of metrics.

        Args:
            metrics: dict of scalar values. Torch tensors and numpy scalars
                are accepted — they're converted to Python floats.
            step: explicit training step. Defaults to an auto-incrementing
                counter, so callers who don't care can omit it.
            commit: ignored for API compatibility with W&B; we always commit.
        """
        if self._finished:
            logger.warning("log() called on a finished run; ignoring")
            return
        del commit  # unused
        if step is None:
            step = self._auto_step
            self._auto_step += 1
        else:
            self._auto_step = max(self._auto_step, int(step) + 1)
        record = {
            "step": int(step),
            "ts": time.time(),
            **_normalize_metrics(metrics),
        }
        with self._buf_lock:
            self._buf.append(record)
            should_flush = len(self._buf) >= _FLUSH_THRESHOLD
        if should_flush:
            self._flush()

    def finish(self, exit_code: int = 0) -> None:
        """Drain the buffer, write the final summary, stop the flusher."""
        if self._finished:
            return
        self._finished = True
        self._stop.set()
        # Give the flusher a moment to exit; then flush whatever's left here too.
        self._flusher.join(timeout=1.0)
        self._flush()

        finished_at = datetime.now(timezone.utc)
        duration = time.monotonic() - self._t0
        finish_payload = {
            "ended_at": finished_at.isoformat(),
            "duration_s": round(duration, 3),
            "exit_code": int(exit_code),
            "summary": dict(self.summary),
        }
        # Merge finish data into summary.json so it's a complete record.
        meta = {
            "id": self.id, "name": self.name, "project": self.project,
            "started_at": self._started_at.isoformat(),
            **finish_payload,
            "tags": self.tags, "group": self.group,
        }
        _atomic_write(self._summary_path, json.dumps(meta, indent=2, default=str))
        self._client.post_finish(self.id, finish_payload)

        global _current
        if _current is self:
            _current = None
        logger.info("siliconworm: finished %s in %.2fs", self.id, duration)

    # ───────────── context manager ─────────────

    def __enter__(self) -> "Run":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            # Don't swallow the exception — finish the run as failed and re-raise.
            self.summary["_error"] = repr(exc)
            self.summary["_traceback"] = "".join(
                traceback.format_exception(exc_type, exc, tb)
            )[-2000:]
            self.finish(exit_code=1)
            return
        self.finish(exit_code=0)

    # ───────────── internals ─────────────

    def _init_payload(self) -> dict[str, Any]:
        return {
            "id": self.id, "name": self.name, "project": self.project,
            "config": self.config, "tags": self.tags, "group": self.group,
            "notes": self.notes, "job_type": self.job_type,
            "started_at": self._started_at.isoformat(),
            "system": self._system,
        }

    def _write_config(self) -> None:
        payload = {
            "id": self.id,
            "name": self.name,
            "project": self.project,
            "tags": self.tags,
            "group": self.group,
            "notes": self.notes,
            "job_type": self.job_type,
            "config": self.config,
            "started_at": self._started_at.isoformat(),
        }
        _atomic_write(self._config_path, json.dumps(payload, indent=2, default=str))

    def _write_summary(self) -> None:
        # Atomic write — render to a sibling tmp file, then os.replace() it
        # over the target. Guarantees a reader (the dashboard, an external
        # tool) sees either the previous version or the new one, never a
        # partial write. write_text() alone is a single write() syscall
        # but a crash mid-syscall can still truncate.
        _atomic_write(
            self._summary_path,
            json.dumps(dict(self.summary), indent=2, default=str),
        )

    def _drain_locked(self) -> list[dict[str, Any]]:
        with self._buf_lock:
            if not self._buf:
                return []
            batch, self._buf = self._buf, []
            return batch

    def _flush(self) -> None:
        batch = self._drain_locked()
        if not batch:
            return
        # Append to local jsonl — always.
        lines = (json.dumps(r, separators=(",", ":"), default=str) for r in batch)
        with self._metrics_path.open("a", encoding="utf-8") as f:
            f.write("\n".join(lines))
            f.write("\n")
        # Best-effort remote ingest.
        self._client.post_metrics(self.id, batch)

    def _flush_loop(self) -> None:
        while not self._stop.wait(_FLUSH_INTERVAL_S):
            try:
                self._flush()
            except Exception as e:  # never propagate from the bg thread
                logger.debug("flush error: %s", e)

    def _atexit_finish(self) -> None:
        # Final backstop — only acts if the user forgot to call finish().
        if not self._finished:
            try:
                self.finish(exit_code=0)
            except Exception:
                pass


# ───────────────────────── module-level convenience ─────────────────────────

def init(
    project: str,
    *,
    name: str | None = None,
    config: dict[str, Any] | None = None,
    tags: list[str] | None = None,
    group: str | None = None,
    notes: str | None = None,
    job_type: str | None = None,
    dir: str | os.PathLike[str] | None = None,
    api_url: str | None = None,
    api_key: str | None = None,
) -> Run:
    """Start a new run and make it the current run.

    The returned ``Run`` is also stored as a module-level singleton, so the
    bare ``siliconworm.log(...)`` / ``siliconworm.finish()`` helpers will dispatch
    to it — handy when threading a ``run`` object through your code is awkward.
    """
    global _current
    if _current is not None and not _current._finished:
        logger.warning(
            "siliconworm.init() called while %s is still active; finishing it",
            _current.id,
        )
        _current.finish()
    _current = Run(
        project=project, name=name, config=config, tags=tags, group=group,
        notes=notes, job_type=job_type, dir=dir, api_url=api_url, api_key=api_key,
    )
    return _current


def log(metrics: dict[str, Any], *, step: int | None = None) -> None:
    """Log metrics on the current run. Call :func:`init` first."""
    if _current is None:
        raise RuntimeError("siliconworm.log() called before siliconworm.init()")
    _current.log(metrics, step=step)


def finish(exit_code: int = 0) -> None:
    """Finish the current run, if any."""
    if _current is not None:
        _current.finish(exit_code=exit_code)


def current() -> Run | None:
    """Return the active run, or None if no run has been initialised."""
    return _current


def __iter__() -> Iterator[Any]:  # pragma: no cover — keeps mypy/ruff happy
    return iter([])
