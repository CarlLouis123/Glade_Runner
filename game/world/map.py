"""World map generation and helpers."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from config import Settings, TILE_SIZE

from . import tiles


@dataclass(slots=True)
class WorldMap:
    """Light-weight tile map representation."""

    width: int
    height: int
    tiles: List[List[int]]

    @property
    def pixel_width(self) -> int:
        return self.width * TILE_SIZE

    @property
    def pixel_height(self) -> int:
        return self.height * TILE_SIZE

    @property
    def start_pixel_position(self) -> tuple[float, float]:
        """Return a reasonable starting position for the player."""

        return (self.pixel_width / 2, self.pixel_height / 2)

    def tile_id_at(self, x: int, y: int) -> int:
        return self.tiles[y][x]

    def tile_def_at(self, x: int, y: int) -> tiles.TileDef:
        return tiles.get_tile_def(self.tile_id_at(x, y))

    @classmethod
    def generate(cls, settings: Settings) -> "WorldMap":
        """Generate a large world map made of themed regions."""

        width = settings.WORLD_WIDTH_TILES
        height = settings.WORLD_HEIGHT_TILES
        raw: List[List[int]] = []

        for y in range(height):
            row: List[int] = []
            for x in range(width):
                normalized_x = x / width
                normalized_y = y / height

                if normalized_y < 0.08:
                    tile_id = tiles.MOUNTAIN
                elif normalized_y < 0.16:
                    tile_id = tiles.FOREST
                elif normalized_y > 0.92:
                    tile_id = tiles.DEEP_WATER
                elif normalized_y > 0.84:
                    tile_id = tiles.SHALLOW_WATER
                elif normalized_y > 0.72:
                    tile_id = tiles.BEACH_SAND
                elif 0.45 < normalized_y < 0.55:
                    tile_id = tiles.ROAD
                elif normalized_x < 0.18:
                    tile_id = tiles.FARM_FIELD
                elif normalized_x > 0.82:
                    tile_id = tiles.VOLCANO_ROCK
                elif 0.35 < normalized_x < 0.65 and 0.25 < normalized_y < 0.45:
                    tile_id = tiles.TOWN_STONE
                else:
                    tile_id = tiles.GRASS

                if 0.40 < normalized_x < 0.60 and 0.20 < normalized_y < 0.22:
                    tile_id = tiles.GATE
                if 0.40 < normalized_x < 0.60 and normalized_y <= 0.20:
                    tile_id = tiles.TOWN_WALL
                if 0.88 < normalized_x and normalized_y < 0.3:
                    tile_id = tiles.LAVA

                row.append(tile_id)
            raw.append(row)

        return cls(width=width, height=height, tiles=raw)
