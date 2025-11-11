"""Global configuration for Glade Runner."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

# Tile size exported at module level for quick access in tests.
TILE_SIZE: int = 64


@dataclass(slots=True)
class Settings:
    """Global configuration container used by the Arcade refactor."""

    # Window / rendering
    WINDOW_WIDTH: int = 1280
    WINDOW_HEIGHT: int = 720
    WINDOW_TITLE: str = "Glade Runner"

    TARGET_FPS: int = 60
    VSYNC: bool = False

    # World configuration (in tiles)
    WORLD_WIDTH_TILES: int = 128
    WORLD_HEIGHT_TILES: int = 128

    PLAYER_SPEED: float = 220.0

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    ASSETS_DIR: Path = BASE_DIR / "assets"
    IMAGES_DIR: Path = ASSETS_DIR / "images"
    SOUNDS_DIR: Path = ASSETS_DIR / "sounds"
    FONTS_DIR: Path = ASSETS_DIR / "fonts"

    # Debug flags
    DEBUG: bool = True
    SHOW_FPS_IN_TITLE: bool = True

    @property
    def world_pixel_width(self) -> int:
        """Return the width of the world in pixels."""

        return self.WORLD_WIDTH_TILES * TILE_SIZE

    @property
    def world_pixel_height(self) -> int:
        """Return the height of the world in pixels."""

        return self.WORLD_HEIGHT_TILES * TILE_SIZE
