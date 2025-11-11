"""Validate key configuration invariants."""
from __future__ import annotations

import os
from collections.abc import Iterator

import arcade
import pyglet
import pytest

os.environ["ARCADE_HEADLESS"] = "True"
os.environ["PYGLET_HEADLESS"] = "True"
pyglet.options["headless"] = True

from config import TILE_SIZE, Settings
from game.app import GameWindow
from game.scenes.gameplay import GameplayView
from game.world.map import WorldMap


@pytest.fixture
def gameplay_scene(monkeypatch: pytest.MonkeyPatch) -> Iterator[GameplayView]:
    monkeypatch.setenv("ARCADE_HEADLESS", "True")
    monkeypatch.setenv("PYGLET_HEADLESS", "True")
    pyglet.options["headless"] = True
    settings = Settings()
    window = GameWindow(settings)
    try:
        world = WorldMap.generate(settings)
        view = GameplayView(window, window.resources, world)
        yield view
    finally:
        window.close()


def test_tile_size_is_positive() -> None:
    assert TILE_SIZE > 0


def test_world_dimensions(gameplay_scene: GameplayView) -> None:
    world = gameplay_scene.world_map
    assert world.pixel_width > 0
    assert world.pixel_height > 0


def test_sprite_lists_initialized(gameplay_scene: GameplayView) -> None:
    sprites = gameplay_scene.sprite_lists
    assert isinstance(sprites.terrain, arcade.SpriteList)
    assert isinstance(sprites.players, arcade.SpriteList)
    assert isinstance(sprites.walls, arcade.SpriteList)
    assert len(sprites.terrain) > 0
    assert len(sprites.players) == 1
