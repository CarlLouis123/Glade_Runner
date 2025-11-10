"""Minimal Arcade stub used for headless testing."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterable, Iterator, List, Sequence

__glade_runner_stub__ = True
headless = True
BACKGROUND_COLOR: tuple[int, int, int] | None = None


# Keep track of windows created by the stub so ``run`` can provide a
# lightweight simulation of the Arcade event loop. The real library manages
# this internally; here we only need minimal behaviour for manual testing.
_WINDOW_REGISTRY: list["Window"] = []


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


class Text:
    """Simplified text primitive mirroring :class:`arcade.Text`."""

    def __init__(
        self,
        text: str,
        start_x: float,
        start_y: float,
        color: Sequence[int],
        font_size: float = 12,
        *,
        anchor_x: str = "left",
        anchor_y: str = "baseline",
        **_kwargs: object,
    ) -> None:
        self.text = text
        self.x = start_x
        self.y = start_y
        self.color = color
        self.font_size = font_size
        self.anchor_x = anchor_x
        self.anchor_y = anchor_y

    def draw(self) -> None:  # pragma: no cover - drawing is skipped in tests
        return

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
        _WINDOW_REGISTRY.append(self)

    def show_view(self, view: View) -> None:
        self._current_view = view
        view.window = self
        view.on_show_view()

    def set_mouse_visible(self, visible: bool) -> None:
        self._mouse_visible = visible

    def center_window(self) -> None:
        return

    def clear(self) -> None:
        return

    def set_caption(self, caption: str) -> None:
        self.title = caption

    def close(self) -> None:
        self.closed = True
        if self in _WINDOW_REGISTRY:
            _WINDOW_REGISTRY.remove(self)


def set_background_color(color_value: Sequence[int]) -> None:
    global BACKGROUND_COLOR
    BACKGROUND_COLOR = tuple(color_value)


def draw_text(*_args: object, **_kwargs: object) -> None:  # pragma: no cover - drawing skipped in tests
    return


def check_for_collision_with_list(sprite: Sprite, sprite_list: Iterable[Sprite]) -> list[Sprite]:
    return []


def get_fps() -> float:
    return 60.0


def run() -> None:  # pragma: no cover - exercised manually, not in tests
    """Simulate a very small portion of Arcade's event loop.

    The real Arcade library hands control over to Pyglet which blocks until
    all windows are closed.  In this kata we only ship a stub, so to avoid the
    confusing "nothing happens" behaviour we iterate over any open windows,
    trigger a draw on their active view and report what occurred.  This keeps
    automated tests fast while still giving developers feedback when they run
    ``run_game.py`` manually.
    """

    active_windows = [window for window in list(_WINDOW_REGISTRY) if not window.closed]
    if not active_windows:
        print("[Arcade stub] No open windows – nothing to run.")
        return

    for window in active_windows:
        view = window._current_view
        if view is not None:
            view.on_draw()

    if len(active_windows) == 1:
        window_title = active_windows[0].title
        print(
            f"[Arcade stub] Simulated event loop for '{window_title}'. "
            "No graphical output is available in this environment."
        )
    else:
        print(
            f"[Arcade stub] Simulated event loop for {len(active_windows)} windows. "
            "No graphical output is available in this environment."
        )

    for window in active_windows:
        window.close()


__all__ = [
    "BACKGROUND_COLOR",
    "Camera2D",
    "Sprite",
    "SpriteList",
    "Text",
    "Texture",
    "View",
    "Window",
    "check_for_collision_with_list",
    "get_fps",
    "color",
    "draw_text",
    "headless",
    "key",
    "run",
    "set_background_color",
]
