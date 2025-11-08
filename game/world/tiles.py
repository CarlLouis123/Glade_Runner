"""Tile definitions for the Glade Runner world."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

Color = Tuple[int, int, int]


@dataclass(frozen=True)
class TileDef:
    """Definition of a single tile type in the world."""

    id: int
    name: str
    color: Color
    walkable: bool


DEEP_WATER = 0
SHALLOW_WATER = 1
GRASS = 2
FOREST = 3
FARM_FIELD = 4
ROAD = 5
TOWN_STONE = 6
MOUNTAIN = 7
VOLCANO_ROCK = 8
LAVA = 9
BEACH_SAND = 10
TOWN_WALL = 11
GATE = 12


_TILE_DEFS: Dict[int, TileDef] = {
    DEEP_WATER: TileDef(DEEP_WATER, "deep_water", (10, 30, 80), False),
    SHALLOW_WATER: TileDef(SHALLOW_WATER, "shallow_water", (25, 90, 140), False),
    GRASS: TileDef(GRASS, "grass", (38, 120, 60), True),
    FOREST: TileDef(FOREST, "forest", (24, 85, 40), True),
    FARM_FIELD: TileDef(FARM_FIELD, "farm_field", (140, 110, 60), True),
    ROAD: TileDef(ROAD, "road", (90, 80, 70), True),
    TOWN_STONE: TileDef(TOWN_STONE, "town_stone", (150, 150, 170), True),
    MOUNTAIN: TileDef(MOUNTAIN, "mountain", (100, 100, 100), False),
    VOLCANO_ROCK: TileDef(VOLCANO_ROCK, "volcano_rock", (90, 60, 50), False),
    LAVA: TileDef(LAVA, "lava", (200, 60, 30), False),
    BEACH_SAND: TileDef(BEACH_SAND, "beach_sand", (210, 190, 120), True),
    TOWN_WALL: TileDef(TOWN_WALL, "town_wall", (70, 70, 90), False),
    GATE: TileDef(GATE, "gate", (130, 100, 60), False),
}


def get_tile_def(tile_id: int) -> TileDef:
    """Return the :class:`TileDef` for ``tile_id``."""

    try:
        return _TILE_DEFS[tile_id]
    except KeyError as exc:  # pragma: no cover - defensive programming
        raise KeyError(f"Unknown tile id: {tile_id}") from exc


__all__ = [
    "TileDef",
    "DEEP_WATER",
    "SHALLOW_WATER",
    "GRASS",
    "FOREST",
    "FARM_FIELD",
    "ROAD",
    "TOWN_STONE",
    "MOUNTAIN",
    "VOLCANO_ROCK",
    "LAVA",
    "BEACH_SAND",
    "TOWN_WALL",
    "GATE",
    "get_tile_def",
]
