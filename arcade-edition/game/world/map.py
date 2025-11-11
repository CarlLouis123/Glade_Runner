"""World map generation and helpers."""
from __future__ import annotations

import math
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
        """Generate a large, hand-crafted inspired world map."""

        width = settings.WORLD_WIDTH_TILES
        height = settings.WORLD_HEIGHT_TILES
        raw: List[List[int]] = [
            [tiles.GRASS for _ in range(width)] for _ in range(height)
        ]

        def in_bounds(x: int, y: int) -> bool:
            return 0 <= x < width and 0 <= y < height

        # --- Mountain ranges -------------------------------------------------
        mountain_band = int(height * 0.18)
        for y in range(mountain_band):
            slope = y / max(mountain_band, 1)
            left_limit = 0.18 + slope * 0.35
            right_limit = 0.82 - slope * 0.35
            for x in range(width):
                normalized_x = x / width
                if normalized_x < left_limit or normalized_x > right_limit:
                    raw[y][x] = tiles.MOUNTAIN

        # Scatter a few isolated peaks deeper into the landscape.
        peak_centers = [
            (int(width * 0.2), int(height * 0.26)),
            (int(width * 0.8), int(height * 0.28)),
            (int(width * 0.5), int(height * 0.22)),
        ]
        for cx, cy in peak_centers:
            radius = int(height * 0.05)
            for dy in range(-radius, radius + 1):
                for dx in range(-radius, radius + 1):
                    x = cx + dx
                    y = cy + dy
                    if not in_bounds(x, y):
                        continue
                    distance = math.sqrt(dx * dx + dy * dy)
                    if distance <= radius * 0.7:
                        raw[y][x] = tiles.MOUNTAIN

        # --- Forest belts ----------------------------------------------------
        forest_top = int(height * 0.22)
        forest_bottom = int(height * 0.72)
        for y in range(forest_top, forest_bottom):
            for x in range(width):
                if raw[y][x] != tiles.GRASS:
                    continue
                noise = (x * 37 + y * 19) % 17
                if noise < 7:
                    raw[y][x] = tiles.FOREST

        # --- Farmland --------------------------------------------------------
        farm_regions = [
            (int(width * 0.08), int(height * 0.72), int(width * 0.22), int(height * 0.18)),
            (int(width * 0.68), int(height * 0.78), int(width * 0.2), int(height * 0.16)),
        ]
        for start_x, start_y, farm_width, farm_height in farm_regions:
            for y in range(start_y, start_y + farm_height):
                for x in range(start_x, start_x + farm_width):
                    if in_bounds(x, y):
                        raw[y][x] = tiles.FARM_FIELD

        # --- Rivers ----------------------------------------------------------
        river_width = 2
        for x in range(width):
            wave = math.sin(x / 14.0) + math.sin(x / 5.0) * 0.3
            center_y = int(height * 0.35 + wave * height * 0.05)
            for offset in range(-river_width, river_width + 1):
                y = center_y + offset
                if not in_bounds(x, y):
                    continue
                raw[y][x] = tiles.RIVER

        # Add a delta feeding into a coastal lake at the southern edge.
        lake_center_x = int(width * 0.82)
        lake_center_y = int(height * 0.9)
        lake_radius = int(height * 0.06)
        for dy in range(-lake_radius, lake_radius + 1):
            for dx in range(-lake_radius, lake_radius + 1):
                x = lake_center_x + dx
                y = lake_center_y + dy
                if not in_bounds(x, y):
                    continue
                if dx * dx + dy * dy <= lake_radius * lake_radius:
                    raw[y][x] = tiles.DEEP_WATER if dx * dx + dy * dy < (lake_radius * 0.6) ** 2 else tiles.SHALLOW_WATER

        # Link the river to the lake with a winding estuary.
        for t in range(lake_center_y):
            x = int(width * 0.76 + math.sin(t / 6.0) * 4)
            y = lake_center_y - t // 2
            if in_bounds(x, y):
                raw[y][x] = tiles.RIVER

        # --- Road network ----------------------------------------------------
        main_horizontal = height // 2
        main_vertical = width // 2

        def lay_road(x: int, y: int) -> None:
            if not in_bounds(x, y):
                return
            if raw[y][x] == tiles.RIVER:
                raw[y][x] = tiles.BRIDGE
            else:
                raw[y][x] = tiles.ROAD

        for x in range(width):
            for offset in (-1, 0, 1):
                lay_road(x, main_horizontal + offset)

        for y in range(height):
            for offset in (-1, 0, 1):
                lay_road(main_vertical + offset, y)

        # Spur roads towards farms and the coastal settlement.
        for x in range(int(width * 0.1), int(width * 0.3)):
            lay_road(x, int(height * 0.68))

        for y in range(int(height * 0.6), height):
            lay_road(int(width * 0.7), y)

        for y in range(int(height * 0.72), height):
            lay_road(int(width * 0.18), y)
        for x in range(int(width * 0.68), int(width * 0.88)):
            lay_road(x, int(height * 0.82))

        # --- Villages --------------------------------------------------------
        village_center_x = main_vertical
        village_center_y = int(height * 0.58)
        village_half_width = int(width * 0.08)
        village_half_height = int(height * 0.08)
        for y in range(
            village_center_y - village_half_height,
            village_center_y + village_half_height,
        ):
            for x in range(
                village_center_x - village_half_width,
                village_center_x + village_half_width,
            ):
                if not in_bounds(x, y):
                    continue
                dx = x - village_center_x
                dy = y - village_center_y
                if abs(dx) % 7 == 0 and abs(dy) % 5 == 0:
                    raw[y][x] = tiles.VILLAGE_HOUSE
                elif abs(dx) <= 1 or abs(dy) <= 1:
                    lay_road(x, y)
                else:
                    if raw[y][x] not in (tiles.RIVER, tiles.BRIDGE):
                        raw[y][x] = tiles.VILLAGE_PATH

        # Market plaza in the heart of the village.
        for y in range(village_center_y - 2, village_center_y + 3):
            for x in range(village_center_x - 2, village_center_x + 3):
                if in_bounds(x, y):
                    raw[y][x] = tiles.TOWN_STONE

        # --- Flower meadows --------------------------------------------------
        for y in range(height):
            for x in range(width):
                if raw[y][x] == tiles.GRASS and (x * 13 + y * 7) % 19 == 0:
                    raw[y][x] = tiles.FLOWER_MEADOW

        # Scatter small picnic clearings near the river banks.
        for x in range(0, width, 5):
            river_y = int(height * 0.35 + math.sin(x / 14.0) * height * 0.05)
            for dy in range(-4, -1):
                y = river_y + dy
                if in_bounds(x, y) and raw[y][x] == tiles.GRASS:
                    raw[y][x] = tiles.FLOWER_MEADOW

        return cls(width=width, height=height, tiles=raw)
