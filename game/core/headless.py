"""Utilities for detecting and reacting to headless Arcade environments."""
from __future__ import annotations

import os

import arcade

_TRUE_VALUES: set[str] = {"1", "true", "yes", "on"}
_ENV_FLAGS: tuple[str, ...] = ("ARCADE_HEADLESS", "PYGLET_HEADLESS")


def _env_flag_enabled(flag: str) -> bool:
    value = os.environ.get(flag)
    return value is not None and value.lower() in _TRUE_VALUES


def is_headless_runtime() -> bool:
    """Return ``True`` when Arcade is operating without a real windowing backend."""

    if any(_env_flag_enabled(flag) for flag in _ENV_FLAGS):
        return True
    return bool(getattr(arcade, "headless", False))


__all__ = ["is_headless_runtime"]
