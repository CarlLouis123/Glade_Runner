"""Resource helpers for the Arcade implementation."""
from __future__ import annotations

from typing import Dict, Tuple

import arcade
from PIL import Image

from config import Settings, TILE_SIZE
from game.world.tiles import TileDef

Color = Tuple[int, int, int]


class ResourceManager:
    """Very small cache for textures used throughout the game."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._tile_textures: Dict[int, arcade.Texture] = {}
        self._player_texture: arcade.Texture | None = None

    def get_tile_texture(self, tile_def: TileDef) -> arcade.Texture:
        """Return a cached filled texture for ``tile_def``."""

        if tile_def.id not in self._tile_textures:
            color = (*tile_def.color, 255)
            name = f"tile::{tile_def.name}::{TILE_SIZE}"
            texture = self._create_filled_texture(name, (TILE_SIZE, TILE_SIZE), color)
            self._tile_textures[tile_def.id] = texture
        return self._tile_textures[tile_def.id]

    def get_player_texture(self) -> arcade.Texture:
        """Return the texture used by the player sprite."""

        if self._player_texture is None:
            color = (230, 85, 75, 255)
            name = f"player::{TILE_SIZE}"
            self._player_texture = self._create_filled_texture(
                name, (TILE_SIZE - 8, TILE_SIZE - 8), color
            )
        return self._player_texture

    @staticmethod
    def _create_filled_texture(
        name: str, size: Tuple[int, int], color: Tuple[int, int, int, int]
    ) -> arcade.Texture:
        """Create a filled texture using Pillow for Arcade versions without ``create_filled``."""

        image = Image.new("RGBA", size, color)
        return arcade.Texture(image=image, name=name)
