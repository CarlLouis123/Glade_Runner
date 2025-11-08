"""Gameplay view that renders and updates the world."""
from __future__ import annotations

from dataclasses import dataclass

import arcade

from config import TILE_SIZE
from game.core.camera import CameraController
from game.core.scene_base import SceneBase
from game.entities.player import Player
from game.world.map import WorldMap


@dataclass(slots=True)
class SpriteLists:
    terrain: arcade.SpriteList
    walls: arcade.SpriteList
    players: arcade.SpriteList


class GameplayView(SceneBase):
    """Main world exploration view."""

    def __init__(self, window: arcade.Window, resources, world_map: WorldMap) -> None:
        super().__init__(window, resources)
        self.world_map = world_map
        self.camera = CameraController(
            window, world_map.pixel_width, world_map.pixel_height
        )
        self.gui_camera = arcade.Camera2D()
        self.sprite_lists = self._create_sprite_lists()
        self.player = self._create_player()
        self._build_world_sprites()

    def _create_sprite_lists(self) -> SpriteLists:
        terrain = arcade.SpriteList(use_spatial_hash=True, spatial_hash_cell_size=TILE_SIZE)
        walls = arcade.SpriteList(use_spatial_hash=True, spatial_hash_cell_size=TILE_SIZE)
        players = arcade.SpriteList()
        return SpriteLists(terrain, walls, players)

    def _create_player(self) -> Player:
        player_texture = self.resources.get_player_texture()
        player = Player(player_texture, self.resources.settings.PLAYER_SPEED)
        start_x, start_y = self.world_map.start_pixel_position
        player.set_position_pixels(start_x, start_y)
        self.sprite_lists.players.append(player)
        return player

    def _build_world_sprites(self) -> None:
        offset = TILE_SIZE / 2
        for y in range(self.world_map.height):
            for x in range(self.world_map.width):
                tile_def = self.world_map.tile_def_at(x, y)
                sprite = arcade.Sprite(texture=self.resources.get_tile_texture(tile_def))
                sprite.center_x = x * TILE_SIZE + offset
                sprite.center_y = y * TILE_SIZE + offset
                self.sprite_lists.terrain.append(sprite)
                if not tile_def.walkable:
                    self.sprite_lists.walls.append(sprite)

    def on_show_view(self) -> None:
        arcade.set_background_color(arcade.color.DARK_SLATE_GRAY)
        if self.window:
            self.window.set_mouse_visible(False)

    def on_draw(self) -> None:
        self.clear()
        with self.camera.activate():
            self.sprite_lists.terrain.draw()
            self.sprite_lists.players.draw()
        with self.gui_camera.activate():
            self._draw_hud()

    def _draw_hud(self) -> None:
        text = "WASD / Arrow keys to move. ESC to return to menu."
        arcade.draw_text(
            text,
            16,
            16,
            arcade.color.WHITE_SMOKE,
            14,
        )

    def on_update(self, delta_time: float) -> None:
        self.sprite_lists.players.update(delta_time)
        self._resolve_collisions()
        self._clamp_player_to_world()
        self.camera.update(self.player.center_x, self.player.center_y)

    def _resolve_collisions(self) -> None:
        if arcade.check_for_collision_with_list(self.player, self.sprite_lists.walls):
            self.player.revert_to_previous_position()

    def _clamp_player_to_world(self) -> None:
        min_x = TILE_SIZE / 2
        min_y = TILE_SIZE / 2
        max_x = self.world_map.pixel_width - TILE_SIZE / 2
        max_y = self.world_map.pixel_height - TILE_SIZE / 2
        self.player.center_x = min(max(self.player.center_x, min_x), max_x)
        self.player.center_y = min(max(self.player.center_y, min_y), max_y)

    def on_key_press(self, symbol: int, modifiers: int) -> None:
        if symbol in (arcade.key.ESCAPE, arcade.key.BACKSPACE):
            from .main_menu import MainMenuView

            menu = MainMenuView(self.game_window, self.resources)
            self.window.show_view(menu)
            return

        movement = self.player.movement
        if symbol in (arcade.key.W, arcade.key.UP):
            movement.up = True
        elif symbol in (arcade.key.S, arcade.key.DOWN):
            movement.down = True
        elif symbol in (arcade.key.A, arcade.key.LEFT):
            movement.left = True
        elif symbol in (arcade.key.D, arcade.key.RIGHT):
            movement.right = True

    def on_key_release(self, symbol: int, modifiers: int) -> None:
        movement = self.player.movement
        if symbol in (arcade.key.W, arcade.key.UP):
            movement.up = False
        elif symbol in (arcade.key.S, arcade.key.DOWN):
            movement.down = False
        elif symbol in (arcade.key.A, arcade.key.LEFT):
            movement.left = False
        elif symbol in (arcade.key.D, arcade.key.RIGHT):
            movement.right = False
