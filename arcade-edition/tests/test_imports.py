"""Sanity checks for module imports."""
from __future__ import annotations

import importlib
import os

import pyglet

os.environ["ARCADE_HEADLESS"] = "True"
os.environ["PYGLET_HEADLESS"] = "True"
pyglet.options["headless"] = True

MODULES = [
    "game.app",
    "game.core.camera",
    "game.core.resource_manager",
    "game.core.scene_base",
    "game.entities.player",
    "game.scenes.gameplay",
    "game.scenes.main_menu",
    "game.world.map",
    "game.world.tiles",
]


def test_modules_importable() -> None:
    for module_name in MODULES:
        module = importlib.import_module(module_name)
        assert module is not None
