"""Minimal Arcade stub used for headless testing."""
from __future__ import annotations

from contextlib import contextmanager, nullcontext
from dataclasses import dataclass
from typing import Iterable, Iterator, List, Sequence

headless = True
BACKGROUND_COLOR: tuple[int, int, int] | None = None


class _ColorPalette:
    DARK_SLATE_GRAY = (47, 79, 79)
    ALMOND = (239, 222, 205)
    LIGHT_GRAY = (211, 211, 211)
    WHITE_SMOKE = (245, 245, 245)


color = _ColorPalette()


class _KeyCodes:
    ENTER = RETURN = 13
    SPACE = 32
    ESCAPE = 27
    BACKSPACE = 8
    W = 87
    A = 65
    S = 83
    D = 68
    UP = 38
    DOWN = 40
    LEFT = 37
    RIGHT = 39


key = _KeyCodes()


class Texture:
    """Trivial texture representation backed by image metadata."""

    def __init__(self, image: object | None = None, name: str | None = None) -> None:
        self.image = image
        self.name = name or "texture"


class Sprite:
    """Simplified sprite storing position and associated texture."""

    def __init__(
        self,
        texture: Texture | None = None,
        hit_box_algorithm: str | None = None,
        **_kwargs: object,
    ) -> None:
        self.texture = texture
        self.hit_box_algorithm = hit_box_algorithm
        self.center_x = 0.0
        self.center_y = 0.0

    def draw(self) -> None:  # pragma: no cover - drawing is a no-op in tests
        return

    def update(self, delta_time: float = 1 / 60) -> None:  # pragma: no cover - override in subclasses
        return


class SpriteList(List[Sprite]):
    """A list-like container with helper methods used by the tests."""

    def __init__(self, *sprites: Sprite, **_kwargs: object) -> None:
        super().__init__(sprites)

    def draw(self) -> None:  # pragma: no cover - drawing is a no-op in tests
        return

    def update(self, delta_time: float = 1 / 60) -> None:
        for sprite in list(self):
            sprite.update(delta_time)


class Camera2D:
    """Very small stand-in for :class:`arcade.Camera2D`."""

    def __init__(self) -> None:
        self.position = (0.0, 0.0)

    @contextmanager
    def activate(self) -> Iterator[None]:
        yield None


class View:
    """Base class mirroring the real Arcade view interface."""

    def __init__(self, window: Window | None = None) -> None:  # type: ignore[name-defined]
        self.window = window

    def on_show_view(self) -> None:  # pragma: no cover - hook for subclasses
        return

    def on_draw(self) -> None:  # pragma: no cover - hook for subclasses
        return

    def clear(self) -> None:
        if self.window is not None:
            self.window.clear()


class Window:
    """Simplified window implementation used for unit tests."""

    def __init__(
        self,
        width: int,
        height: int,
        title: str,
        resizable: bool = False,
        update_rate: float | None = None,
        vsync: bool = False,
        **_kwargs: object,
    ) -> None:
        self.width = width
        self.height = height
        self.title = title
        self.resizable = resizable
        self.update_rate = update_rate
        self.vsync = vsync
        self.closed = False
        self._mouse_visible = True
        self._current_view: View | None = None

    def show_view(self, view: View) -> None:
        self._current_view = view
        view.window = self

    def set_mouse_visible(self, visible: bool) -> None:
        self._mouse_visible = visible

    def center_window(self) -> None:
        return

    def clear(self) -> None:
        return

    def close(self) -> None:
        self.closed = True


def set_background_color(color_value: Sequence[int]) -> None:
    global BACKGROUND_COLOR
    BACKGROUND_COLOR = tuple(color_value)


def draw_text(*_args: object, **_kwargs: object) -> None:  # pragma: no cover - drawing skipped in tests
    return


def check_for_collision_with_list(sprite: Sprite, sprite_list: Iterable[Sprite]) -> list[Sprite]:
    return []


def run() -> None:  # pragma: no cover - event loop omitted in tests
    return


__all__ = [
    "BACKGROUND_COLOR",
    "Camera2D",
    "Sprite",
    "SpriteList",
    "Texture",
    "View",
    "Window",
    "check_for_collision_with_list",
    "color",
    "draw_text",
    "headless",
    "key",
    "run",
    "set_background_color",
]
