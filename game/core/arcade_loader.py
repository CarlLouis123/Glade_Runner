"""Helpers for selecting between the real Arcade package and the local stub."""

from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path
from types import ModuleType

_TRUE_VALUES = {"1", "true", "yes", "on"}


def _resolve_path(entry: str) -> Path:
    if not entry:
        return Path.cwd()
    return Path(entry).resolve()


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _is_truthy_env(var_name: str) -> bool:
    value = os.environ.get(var_name)
    return value is not None and value.lower() in _TRUE_VALUES


def is_stub(module: ModuleType | None = None) -> bool:
    """Return ``True`` when ``module`` refers to the bundled Arcade stub."""

    if module is None:
        module = sys.modules.get("arcade")
    if module is None:
        return False
    return bool(getattr(module, "__glade_runner_stub__", False))


def ensure_real_arcade(*, force: bool = False) -> bool:
    """Load the real Arcade package when available.

    Parameters
    ----------
    force:
        When ``True`` the function will always attempt to import the real
        package.  When ``False`` (the default) it respects the
        ``GLADE_RUNNER_FORCE_STUB`` environment variable which forces the stub
        to remain active.

    Returns
    -------
    bool
        ``True`` when the real Arcade package is active, ``False`` otherwise.
    """

    if not force and _is_truthy_env("GLADE_RUNNER_FORCE_STUB"):
        return False

    active_module = sys.modules.get("arcade")
    if active_module is not None and not is_stub(active_module):
        return True

    project_root = _project_root()
    removed_entries: list[tuple[int, str]] = []

    for index in range(len(sys.path) - 1, -1, -1):
        entry = sys.path[index]
        if _resolve_path(entry) == project_root:
            removed_entries.append((index, entry))
            del sys.path[index]

    try:
        if "arcade" in sys.modules:
            stub_module = sys.modules.pop("arcade")
        else:
            stub_module = None

        try:
            real_module = importlib.import_module("arcade")
        except ModuleNotFoundError:
            if stub_module is not None:
                sys.modules["arcade"] = stub_module
            return False

        sys.modules["arcade"] = real_module
        return True
    finally:
        for index, entry in reversed(removed_entries):
            sys.path.insert(index, entry)


__all__ = ["ensure_real_arcade", "is_stub"]

