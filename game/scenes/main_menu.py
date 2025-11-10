"""Main menu view for the Arcade version of Glade Runner."""
from __future__ import annotations

from textwrap import dedent

import arcade

from game.core.scene_base import SceneBase
from game.world.map import WorldMap


class MainMenuView(SceneBase):
    """Simple title screen that lets the player start the adventure."""

    def __init__(self, window: arcade.Window, resources) -> None:
        super().__init__(window, resources)
        center_x = window.width / 2
        self.title_text = arcade.Text(
            "Glade Runner",
            start_x=center_x,
            start_y=window.height * 0.6,
            color=arcade.color.ALMOND,
            font_size=64,
            anchor_x="center",
        )
        self.subtitle_text = arcade.Text(
            "Press Enter to explore the glade",
            start_x=center_x,
            start_y=window.height * 0.4,
            color=arcade.color.LIGHT_GRAY,
            font_size=24,
            anchor_x="center",
        )

    def on_show_view(self) -> None:
        arcade.set_background_color(arcade.color.DARK_SLATE_GRAY)
        if self.window:
            self.window.set_mouse_visible(True)

    def on_resize(self, width: int, height: int) -> None:
        super().on_resize(width, height)
        center_x = width / 2
        self.title_text.x = center_x
        self.title_text.y = height * 0.6
        self.subtitle_text.x = center_x
        self.subtitle_text.y = height * 0.4

    def on_draw(self) -> None:
        self.clear()
        self.title_text.draw()
        self.subtitle_text.draw()
        self._emit_headless_message(
            dedent(
                """
                === Glade Runner – Main Menu ===
                • Press Enter/Space to generate a new world.
                • Press Esc to close the game.
                (Graphical output is disabled in headless mode.)
                """
            )
        )

    def on_key_press(self, symbol: int, modifiers: int) -> None:
        if symbol in (arcade.key.ENTER, arcade.key.RETURN, arcade.key.SPACE):
            from .gameplay import GameplayView

            world = WorldMap.generate(self.resources.settings)
            gameplay = GameplayView(self.game_window, self.resources, world)
            self.window.show_view(gameplay)
        elif symbol == arcade.key.ESCAPE:
            if self.window:
                self.window.close()
