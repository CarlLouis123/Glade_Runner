"""Main menu view for the Arcade version of Glade Runner."""
from __future__ import annotations

import arcade

from game.core.scene_base import SceneBase
from game.world.map import WorldMap


class MainMenuView(SceneBase):
    """Simple title screen that lets the player start the adventure."""

    def on_show_view(self) -> None:
        arcade.set_background_color(arcade.color.DARK_SLATE_GRAY)
        if self.window:
            self.window.set_mouse_visible(True)

    def on_draw(self) -> None:
        self.clear()
        title = "Glade Runner"
        subtitle = "Press Enter to explore the glade"
        arcade.draw_text(
            title,
            start_x=self.game_window.width / 2,
            start_y=self.game_window.height * 0.6,
            color=arcade.color.ALMOND,
            font_size=64,
            anchor_x="center",
        )
        arcade.draw_text(
            subtitle,
            start_x=self.game_window.width / 2,
            start_y=self.game_window.height * 0.4,
            color=arcade.color.LIGHT_GRAY,
            font_size=24,
            anchor_x="center",
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
