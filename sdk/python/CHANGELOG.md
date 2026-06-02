# Changelog

All notable changes to the `siliconworm` Python SDK are documented in this
file. The format is loosely based on [Keep a Changelog][kac], and the project
adheres to [Semantic Versioning][semver].

[kac]: https://keepachangelog.com/en/1.1.0/
[semver]: https://semver.org/spec/v2.0.0.html

## [Unreleased]

## [0.2.0] — 2026-06-03

### Added

- **MLX support** — `.log({"loss": mx.array})` now works out of the box. 0-d
  arrays are `.item()`-ed; nd arrays go through `mx.mean().item()`. Install
  with `pip install "siliconworm[mlx]"`.
- **MLX environment capture** — `system.json` now has an `"mlx"` block with
  the framework version, Metal availability, default device, and the
  Metal device's name/architecture/memory ceilings (when on macOS).
- **`examples/mnist_mlx.py`** — port of the torch MNIST example to MLX,
  with `mx.compile`-d training step. Self-contained MNIST downloader; the
  only deps are `mlx` and `siliconworm`.

### Changed

- **Hot-path coercer dispatch** is now an O(1) cached lookup keyed by
  `type(v)` rather than an f-string + `startswith` chain. First call for a
  given type resolves and caches the coercer; subsequent calls are a single
  dict lookup + function call. Builtins (`bool`/`int`/`float`/`str`/`None`)
  are pre-seeded so they never hit the resolver.
- **Atomic JSON writes** — `summary.json`, `config.json`, and `system.json`
  are now written via a sibling tmp file + `os.replace()`, so a crash mid-
  write can never leave a truncated or partially-written file on disk.

## [0.1.0] — 2026-06-03

Initial public release.

### Added

- `Run`, `Summary`, and the module-level `init` / `log` / `finish` API.
- Local-first writer — every run produces `~/.siliconworm/runs/<id>/`
  containing `config.json`, `metrics.jsonl`, `summary.json`, `system.json`.
- Optional HTTP ingest via `SILICONWORM_API_URL` / `SILICONWORM_API_KEY`
  (no-op when unset; never blocks training on the network).
- Automatic environment capture: git sha/branch/dirty, hostname, Python
  version, process argv, GPU info (via torch if available).
- ULID-style run ids, auto-generated `adjective-noun-NNN` run names.
- Background batched flusher (every 2 s or after 64 records).
- Context-manager support; exceptions are recorded as `summary._error` /
  `summary._traceback` before re-raising.
- `atexit` backstop so forgetting to call `.finish()` still produces a
  complete summary on disk.
- Torch tensor / numpy scalar coercion inside `.log()`.
- Examples: `examples/quickstart.py` (no deps) and `examples/mnist.py`
  (real PyTorch training).
