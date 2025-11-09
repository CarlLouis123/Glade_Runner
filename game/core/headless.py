"""Utilities for detecting and reacting to headless Arcade environments."""
from __future__ import annotations

import os
import sys

import arcade

_TRUE_VALUES: set[str] = {"1", "true", "yes", "on"}
_ENV_FLAGS: tuple[str, ...] = ("ARCADE_HEADLESS", "PYGLET_HEADLESS")


def _env_flag_enabled(flag: str) -> bool:
    value = os.environ.get(flag)
    return value is not None and value.lower() in _TRUE_VALUES


def _arcade_module() -> "module":
    return sys.modules.get("arcade", arcade)


def headless_env_requested() -> bool:
    """Return ``True`` if environment flags request a headless runtime."""

    return any(_env_flag_enabled(flag) for flag in _ENV_FLAGS)


def is_headless_runtime() -> bool:
    """Return ``True`` when Arcade is operating without a real windowing backend."""

    if headless_env_requested():
        return True
    module = _arcade_module()
    return bool(getattr(module, "headless", False))


__all__ = ["headless_env_requested", "is_headless_runtime"]
