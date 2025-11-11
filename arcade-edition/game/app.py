"""Application bootstrap for the Arcade-based Glade Runner."""
from __future__ import annotations

import os
import sys

import pyglet

_TRUE_VALUES = {"1", "true", "yes", "on"}
_HEADLESS_FLAGS = ("ARCADE_HEADLESS", "PYGLET_HEADLESS")


def _should_enable_headless() -> bool:
    if any(os.environ.get(flag, "").lower() in _TRUE_VALUES for flag in _HEADLESS_FLAGS):
        return True

    if sys.platform.startswith("linux") and not (
        os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")
    ):
        return True

    return False


if _should_enable_headless():
    os.environ.setdefault("PYGLET_HEADLESS", "True")
    pyglet.options["headless"] = True

import arcade

from game.core.headless import is_headless_runtime

from config import Settings
from game.core.resource_manager import ResourceManager
from game.scenes.main_menu import MainMenuView


class GameWindow(arcade.Window):
    """Main arcade window controlling the game."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings()
        super().__init__(
            width=self.settings.WINDOW_WIDTH,
            height=self.settings.WINDOW_HEIGHT,
            title=self.settings.WINDOW_TITLE,
            resizable=False,
            update_rate=1 / self.settings.TARGET_FPS,
            vsync=self.settings.VSYNC,
        )
        self.center_window()
        self.resources = ResourceManager(self.settings)
        self._fps_timer = 0.0
        self.show_main_menu()

    def show_main_menu(self) -> None:
        """Switch to the main menu view."""

        view = MainMenuView(self, self.resources)
        self.show_view(view)

    def on_update(self, delta_time: float) -> None:  # pragma: no cover - runtime behaviour
        if not self.settings.SHOW_FPS_IN_TITLE or is_headless_runtime():
            return

        self._fps_timer += delta_time
        if self._fps_timer < 0.5:
            return

        fps = arcade.get_fps()
        caption = f"{self.settings.WINDOW_TITLE} – {fps:.0f} FPS"
        set_caption = getattr(self, "set_caption", None)
        if callable(set_caption):  # pragma: no branch - the stub always provides it
            set_caption(caption)
        self._fps_timer = 0.0


def create_window(settings: Settings | None = None) -> GameWindow:
    """Create and return the :class:`GameWindow`."""

    return GameWindow(settings=settings)


def run(settings: Settings | None = None) -> None:
    """Create the window and enter the Arcade event loop."""

    create_window(settings=settings)
    arcade.run()
