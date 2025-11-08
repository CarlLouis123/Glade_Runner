# config/settings.py
from pathlib import Path


class Settings:
    """Global configuration for Glade Runner."""

    # Window / rendering
    WINDOW_WIDTH = 1280
    WINDOW_HEIGHT = 720
    WINDOW_TITLE = "Glade Runner"

    TARGET_FPS = 60
    VSYNC = False  # If your platform / driver supports it

    # World settings (top-down exploration world)
    WORLD_WIDTH = 4000
    WORLD_HEIGHT = 4000

    # Paths
    BASE_DIR = Path(__file__).resolve().parent.parent
    ASSETS_DIR = BASE_DIR / "assets"
    IMAGES_DIR = ASSETS_DIR / "images"
    SOUNDS_DIR = ASSETS_DIR / "sounds"
    FONTS_DIR = ASSETS_DIR / "fonts"

    # Debug flags
    DEBUG = True
    SHOW_FPS_IN_TITLE = True
