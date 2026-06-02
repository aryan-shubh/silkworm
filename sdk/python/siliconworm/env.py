"""Best-effort capture of run environment metadata.

Everything in this module is failure-tolerant: each probe is wrapped in a
try/except that falls back to ``None`` rather than crashing the training
process. Capturing env should never break a run.
"""

from __future__ import annotations

import getpass
import os
import platform
import socket
import subprocess
import sys
from typing import Any


def _safe(fn, default=None):
    try:
        return fn()
    except Exception:
        return default


def _git(args: list[str]) -> str | None:
    try:
        out = subprocess.check_output(
            ["git", *args],
            stderr=subprocess.DEVNULL,
            timeout=2,
        )
        return out.decode().strip() or None
    except Exception:
        return None


def _gpu_info() -> dict[str, Any] | None:
    """If torch is importable AND a GPU is visible, return device info."""
    try:
        import torch  # type: ignore[import-not-found]
    except Exception:
        return None
    try:
        if not torch.cuda.is_available():
            return {"available": False}
        return {
            "available": True,
            "device_count": torch.cuda.device_count(),
            "devices": [
                {
                    "name": torch.cuda.get_device_name(i),
                    "capability": list(torch.cuda.get_device_capability(i)),
                    "total_memory_gb": round(
                        torch.cuda.get_device_properties(i).total_memory / 1024**3, 2
                    ),
                }
                for i in range(torch.cuda.device_count())
            ],
            "cuda_version": torch.version.cuda,  # type: ignore[attr-defined]
            "torch_version": torch.__version__,
        }
    except Exception:
        return None


def _mlx_info() -> dict[str, Any] | None:
    """If mlx is importable, return version + Metal device info.

    MLX is Apple's array framework — the typical use case here is M-series
    Macs where the GPU is the Metal device. We expose what the user actually
    needs in the dashboard: framework version, whether Metal is live, device
    name, and memory ceilings.
    """
    try:
        import mlx  # type: ignore[import-not-found]
        import mlx.core as mx  # type: ignore[import-not-found]
    except Exception:
        return None
    info: dict[str, Any] = {
        "available": True,
        "mlx_version": getattr(mlx, "__version__", None),
    }
    # mlx.metal exists on macOS builds; gate every probe so a non-mac build
    # doesn't tank the capture.
    metal = getattr(mx, "metal", None)
    if metal is not None:
        info["metal_available"] = _safe(metal.is_available, default=False)
        device = _safe(metal.device_info)
        if isinstance(device, dict):
            info["device"] = {
                "name": device.get("device_name"),
                "architecture": device.get("architecture"),
                "memory_size_gb": round(
                    (device.get("memory_size") or 0) / 1024**3, 2
                ) or None,
                "max_buffer_gb": round(
                    (device.get("max_buffer_length") or 0) / 1024**3, 2
                ) or None,
                "max_recommended_working_set_gb": round(
                    (device.get("max_recommended_working_set_size") or 0) / 1024**3, 2
                ) or None,
            }
    # Current default device, e.g. Device(gpu, 0) on M-series.
    info["default_device"] = _safe(lambda: repr(mx.default_device()))
    return info


def capture() -> dict[str, Any]:
    """Snapshot of the host environment at run start.

    Always returns a dict; missing values become ``None`` rather than raising.
    """
    return {
        "user": _safe(getpass.getuser),
        "hostname": _safe(socket.gethostname),
        "os": {
            "system": platform.system(),
            "release": _safe(platform.release),
            "machine": _safe(platform.machine),
        },
        "python": {
            "version": sys.version.split()[0],
            "executable": sys.executable,
            "implementation": platform.python_implementation(),
        },
        "git": {
            "sha": _git(["rev-parse", "HEAD"]),
            "branch": _git(["rev-parse", "--abbrev-ref", "HEAD"]),
            "dirty": _safe(
                lambda: bool(_git(["status", "--porcelain"])),
                default=False,
            ),
            "remote": _git(["config", "--get", "remote.origin.url"]),
        },
        "process": {
            "argv": sys.argv,
            "cwd": _safe(os.getcwd),
            "pid": os.getpid(),
        },
        "gpu": _gpu_info(),
        "mlx": _mlx_info(),
    }
