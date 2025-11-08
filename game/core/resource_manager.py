# game/core/resource_manager.py
from pathlib import Path
import pygame


class ResourceManager:
    """
    Simple resource manager with caching.
    Extend this with sprite sheets, maps, etc.
    """

    def __init__(self, images_dir: Path, sounds_dir: Path, fonts_dir: Path):
        self.images_dir = images_dir
        self.sounds_dir = sounds_dir
        self.fonts_dir = fonts_dir

        self._image_cache: dict[str, pygame.Surface] = {}
        self._sound_cache: dict[str, pygame.mixer.Sound] = {}
        self._font_cache: dict[tuple[str, int], pygame.font.Font] = {}

    def load_image(self, name: str, colorkey=None) -> pygame.Surface:
        if name in self._image_cache:
            return self._image_cache[name]

        path = self.images_dir / name
        image = pygame.image.load(path.as_posix()).convert_alpha()
        if colorkey is not None:
            image.set_colorkey(colorkey)
        self._image_cache[name] = image
        return image

    def load_sound(self, name: str) -> pygame.mixer.Sound:
        if name in self._sound_cache:
            return self._sound_cache[name]

        path = self.sounds_dir / name
        sound = pygame.mixer.Sound(path.as_posix())
        self._sound_cache[name] = sound
        return sound

    def load_font(self, name: str, size: int) -> pygame.font.Font:
        key = (name, size)
        if key in self._font_cache:
            return self._font_cache[key]

        path = self.fonts_dir / name
        font = pygame.font.Font(path.as_posix(), size)
        self._font_cache[key] = font
        return font
