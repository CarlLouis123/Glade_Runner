"""Application bootstrap for the Arcade-based Glade Runner."""
from __future__ import annotations

import os

if os.environ.get("ARCADE_HEADLESS", "").lower() in {"1", "true", "yes"} or os.environ.get(
    "PYGLET_HEADLESS", ""
).lower() in {"1", "true", "yes"}:
    import pyglet

    os.environ.setdefault("PYGLET_HEADLESS", "True")
    pyglet.options["headless"] = True

import arcade

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
        self.show_main_menu()

    def show_main_menu(self) -> None:
        """Switch to the main menu view."""

        view = MainMenuView(self, self.resources)
        self.show_view(view)


def create_window(settings: Settings | None = None) -> GameWindow:
    """Create and return the :class:`GameWindow`."""

    return GameWindow(settings=settings)


def run(settings: Settings | None = None) -> None:
    """Create the window and enter the Arcade event loop."""

    create_window(settings=settings)
    arcade.run()
