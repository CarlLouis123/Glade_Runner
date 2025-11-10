"""Player entity implemented as an :class:`arcade.Sprite`."""
from __future__ import annotations

import math
from dataclasses import dataclass

import arcade

from config import TILE_SIZE


@dataclass(slots=True)
class MovementState:
    """Represents the current directional input state."""

    up: bool = False
    down: bool = False
    left: bool = False
    right: bool = False

    def direction(self) -> tuple[float, float]:
        """Return a normalised (x, y) direction vector."""

        dx = (1.0 if self.right else 0.0) - (1.0 if self.left else 0.0)
        dy = (1.0 if self.up else 0.0) - (1.0 if self.down else 0.0)
        length = math.hypot(dx, dy)
        if length == 0:
            return 0.0, 0.0
        return dx / length, dy / length


class Player(arcade.Sprite):
    """Simple player sprite that supports smooth movement."""

    def __init__(self, texture: arcade.Texture, speed: float) -> None:
        super().__init__(texture=texture, hit_box_algorithm="Simple")
        self.speed = speed
        self.movement = MovementState()
        self._previous_position: tuple[float, float] = (0.0, 0.0)

    def set_position_pixels(self, x: float, y: float) -> None:
        self.center_x = x
        self.center_y = y

    def update(self, delta_time: float = 1 / 60) -> None:  # type: ignore[override]
        self._previous_position = (self.center_x, self.center_y)
        dx, dy = self.movement.direction()
        self.center_x += dx * self.speed * delta_time
        self.center_y += dy * self.speed * delta_time

    def revert_to_previous_position(self) -> None:
        self.center_x, self.center_y = self._previous_position

    def align_to_grid(self) -> None:
        """Align the sprite roughly to the underlying tile grid."""

        self.center_x = round(self.center_x / TILE_SIZE) * TILE_SIZE
        self.center_y = round(self.center_y / TILE_SIZE) * TILE_SIZE
