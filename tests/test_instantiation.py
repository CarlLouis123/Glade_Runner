"""Ensure key Arcade classes can be instantiated."""
from __future__ import annotations

import os
from collections.abc import Iterator

import pyglet
import pytest

os.environ["ARCADE_HEADLESS"] = "True"
os.environ["PYGLET_HEADLESS"] = "True"
pyglet.options["headless"] = True

from config import Settings
from game.app import GameWindow
from game.scenes.gameplay import GameplayView
from game.scenes.main_menu import MainMenuView
from game.world.map import WorldMap


@pytest.fixture
def game_window(monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[GameWindow, Settings]]:
    monkeypatch.setenv("ARCADE_HEADLESS", "True")
    monkeypatch.setenv("PYGLET_HEADLESS", "True")
    pyglet.options["headless"] = True
    settings = Settings()
    window = GameWindow(settings)
    try:
        yield window, settings
    finally:
        window.close()


def test_game_window_instantiates(game_window: tuple[GameWindow, Settings]) -> None:
    window, settings = game_window
    assert window.width == settings.WINDOW_WIDTH
    assert window.height == settings.WINDOW_HEIGHT


def test_views_can_be_created(game_window: tuple[GameWindow, Settings]) -> None:
    window, settings = game_window
    resources = window.resources

    menu = MainMenuView(window, resources)
    assert menu.window is window

    gameplay = GameplayView(window, resources, WorldMap.generate(settings))
    assert gameplay.world_map.width == settings.WORLD_WIDTH_TILES
    assert len(gameplay.sprite_lists.players) == 1
