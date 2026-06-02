"""MNIST + small MLP on Apple Silicon via MLX, instrumented with siliconworm.

Same training spec as ``examples/mnist.py`` but on MLX's Metal-backed array
framework instead of PyTorch. The only non-stdlib deps are mlx and the SDK::

    pip install mlx siliconworm

    python examples/mnist_mlx.py

MNIST is downloaded into ``~/.cache/siliconworm-mnist/`` on first run.
"""

from __future__ import annotations

import gzip
import struct
from pathlib import Path
from urllib.request import urlretrieve

import mlx.core as mx
import mlx.nn as nn
import mlx.optimizers as optim
import numpy as np

import siliconworm as sw

# ───────────────────────── MNIST loader ─────────────────────────
# Self-contained download + IDX parser; no torchvision dependency.

_MNIST_BASE = "https://storage.googleapis.com/cvdf-datasets/mnist/"
_FILES = {
    "train_x": "train-images-idx3-ubyte.gz",
    "train_y": "train-labels-idx1-ubyte.gz",
    "test_x":  "t10k-images-idx3-ubyte.gz",
    "test_y":  "t10k-labels-idx1-ubyte.gz",
}


def _read_idx(path: Path) -> np.ndarray:
    with gzip.open(path, "rb") as f:
        magic, n = struct.unpack(">II", f.read(8))
        if magic == 2051:           # images
            rows, cols = struct.unpack(">II", f.read(8))
            return np.frombuffer(f.read(), dtype=np.uint8).reshape(n, rows * cols)
        if magic == 2049:           # labels
            return np.frombuffer(f.read(), dtype=np.uint8)
        raise ValueError(f"unknown IDX magic: {magic}")


def load_mnist(cache: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    cache.mkdir(parents=True, exist_ok=True)
    for fname in _FILES.values():
        local = cache / fname
        if not local.exists():
            print(f"  ↓ downloading {fname}")
            urlretrieve(_MNIST_BASE + fname, local)
    train_x = _read_idx(cache / _FILES["train_x"]).astype(np.float32) / 255.0
    train_y = _read_idx(cache / _FILES["train_y"]).astype(np.int32)
    test_x  = _read_idx(cache / _FILES["test_x"]).astype(np.float32)  / 255.0
    test_y  = _read_idx(cache / _FILES["test_y"]).astype(np.int32)
    # Match the torch example's normalisation: zero-mean, unit-variance.
    mean, std = 0.1307, 0.3081
    train_x = (train_x - mean) / std
    test_x  = (test_x  - mean) / std
    return train_x, train_y, test_x, test_y


# ───────────────────────── model ─────────────────────────

class MLP(nn.Module):
    """Mirror of the torch example: 784 → 256 → 128 → 10, ReLU."""

    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, 10)

    def __call__(self, x: mx.array) -> mx.array:
        x = nn.relu(self.fc1(x))
        x = nn.relu(self.fc2(x))
        return self.fc3(x)


def loss_fn(model: MLP, x: mx.array, y: mx.array) -> mx.array:
    return nn.losses.cross_entropy(model(x), y, reduction="mean")


# ───────────────────────── train ─────────────────────────

def main() -> None:
    mx.random.seed(42)
    cache = Path.home() / ".cache" / "siliconworm-mnist"
    train_x, train_y, test_x, test_y = load_mnist(cache)

    run = sw.init(
        project="mnist-mlp",
        name="demo-run-mlx-1",
        config={
            "lr": 3e-4,
            "batch_size": 128,
            "optimizer": "adamw",
            "weight_decay": 0.01,
            "epochs": 3,
            "arch": "MLP-256-128-10",
            "seed": 42,
            "dataset": "MNIST",
            "framework": "mlx",
        },
        tags=["baseline", "mnist", "mlx", "apple-silicon"],
    )

    model = MLP()
    mx.eval(model.parameters())  # materialise initial weights
    opt = optim.AdamW(learning_rate=3e-4, weight_decay=0.01)

    # JIT-compiled grad fn — major perf win on MLX. The function gets traced
    # once, then every step reuses the compiled graph. Without this, every
    # step rebuilds the autograd graph from Python.
    loss_and_grad = nn.value_and_grad(model, loss_fn)

    @mx.compile
    def train_step(model_state, opt_state, x_batch, y_batch):
        # The closure captures `model` and `opt`; we return state to keep the
        # function pure for mx.compile.
        loss, grads = loss_and_grad(model, x_batch, y_batch)
        opt.update(model, grads)
        return loss

    n_train = train_x.shape[0]
    batch_size = 128

    step = 0
    EPOCHS = 3
    for epoch in range(EPOCHS):
        # Numpy shuffle keeps things tiny and reproducible across runs.
        perm = np.random.RandomState(42 + epoch).permutation(n_train)
        for i in range(0, n_train, batch_size):
            idx = perm[i : i + batch_size]
            x_batch = mx.array(train_x[idx])
            y_batch = mx.array(train_y[idx])

            loss = train_step(model.state, opt.state, x_batch, y_batch)
            mx.eval(model.parameters(), opt.state, loss)

            if step % 5 == 0:
                # Cheap proxy for grad norm: weight norm change. MLX doesn't
                # expose grads after .update() the way torch does, so we log
                # the loss-only line here. Add explicit grad logging if you
                # need it — the SDK accepts any scalar.
                run.log({"train_loss": loss, "lr": 3e-4}, step=step)
            step += 1

        # End-of-epoch eval.
        n_test = test_x.shape[0]
        correct = 0
        val_loss = 0.0
        for i in range(0, n_test, 512):
            x = mx.array(test_x[i : i + 512])
            y = mx.array(test_y[i : i + 512])
            logits = model(x)
            val_loss += float(nn.losses.cross_entropy(logits, y, reduction="sum").item())
            correct += int((logits.argmax(axis=1) == y).sum().item())
        val_loss /= n_test
        acc = correct / n_test
        run.log({"val_loss": val_loss, "accuracy": acc, "epoch": epoch}, step=step)
        print(f"epoch {epoch}: val_loss={val_loss:.4f} acc={acc:.4f}")

    run.summary.update(
        {
            "final_train_loss": loss,
            "final_val_loss": val_loss,
            "final_accuracy": acc,
            "total_steps": step,
        }
    )
    run.finish()


if __name__ == "__main__":
    main()
