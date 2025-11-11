"""Camera helpers built around :class:`arcade.Camera2D`."""
from __future__ import annotations

from contextlib import AbstractContextManager

import arcade


class CameraController:
    """Simple camera that keeps the player roughly centred."""

    def __init__(self, window: arcade.Window, world_width: int, world_height: int) -> None:
        self.window = window
        self.world_width = world_width
        self.world_height = world_height
        self.camera = arcade.Camera2D()

    def update(self, focus_x: float, focus_y: float) -> None:
        """Move the camera towards ``focus_x``/``focus_y`` while clamping to bounds."""

        half_w = self.window.width / 2
        half_h = self.window.height / 2
        min_x = half_w
        max_x = max(half_w, self.world_width - half_w)
        min_y = half_h
        max_y = max(half_h, self.world_height - half_h)

        clamped_x = min(max(focus_x, min_x), max_x)
        clamped_y = min(max(focus_y, min_y), max_y)
        self.camera.position = (clamped_x, clamped_y)

    def activate(self) -> AbstractContextManager[None]:
        """Context manager that activates the camera for drawing."""

        return self.camera.activate()
