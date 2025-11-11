"""Test suite for Glade Runner.

This package configures Arcade/Pyglet to operate in headless mode before the
individual test modules import :mod:`arcade`. Doing so prevents the dependency
from attempting to load native OpenGL libraries during collection.
"""
from __future__ import annotations

import os

os.environ.setdefault("ARCADE_HEADLESS", "True")
os.environ.setdefault("PYGLET_HEADLESS", "True")
os.environ.pop("ARCADE_HEADLESS_DISABLED", None)

try:
    import pyglet  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when pyglet isn't installed
    pyglet = None  # type: ignore
else:
    pyglet.options["headless"] = True
