# game/entities/player.py
from typing import Callable

import pygame


class Player:
    """
    Minimal top-down player entity.
    Extend this with animations, stats, inventory, etc.
    """

    def __init__(self, x: float, y: float, speed: float = 250.0, size: int = 32):
        self.pos = pygame.Vector2(x, y)
        self.speed = speed
        self.size = size
        self.color = (50, 200, 80)  # Placeholder colour
        self.rect = pygame.Rect(self.pos.x, self.pos.y, size, size)

    def handle_input(self, dt: float) -> pygame.Vector2:
        keys = pygame.key.get_pressed()
        movement = pygame.Vector2(0, 0)

        if keys[pygame.K_w] or keys[pygame.K_UP]:
            movement.y -= 1
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:
            movement.y += 1
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            movement.x -= 1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            movement.x += 1

        if movement.length_squared() > 0:
            movement = movement.normalize() * self.speed * dt
        else:
            movement.update(0, 0)

        return movement

    def clamp_to_world(self, world_width: int, world_height: int) -> None:
        self.pos.x = max(0, min(self.pos.x, world_width - self.size))
        self.pos.y = max(0, min(self.pos.y, world_height - self.size))

    def update(
        self,
        dt: float,
        world_width: int,
        world_height: int,
        is_walkable_at: Callable[[float, float], bool],
    ) -> None:
        movement = self.handle_input(dt)
        if movement.length_squared() > 0:
            self._move(movement, is_walkable_at)

        self.clamp_to_world(world_width, world_height)
        self.rect.topleft = (int(self.pos.x), int(self.pos.y))

    def _move(self, movement: pygame.Vector2, is_walkable_at: Callable[[float, float], bool]) -> None:
        # Move along X axis
        if movement.x:
            new_x = self.pos.x + movement.x
            if self._is_position_walkable(new_x, self.pos.y, is_walkable_at):
                self.pos.x = new_x

        # Move along Y axis
        if movement.y:
            new_y = self.pos.y + movement.y
            if self._is_position_walkable(self.pos.x, new_y, is_walkable_at):
                self.pos.y = new_y

    def _is_position_walkable(
        self,
        x: float,
        y: float,
        is_walkable_at: Callable[[float, float], bool],
    ) -> bool:
        corners = [
            (x, y),
            (x + self.size - 1, y),
            (x, y + self.size - 1),
            (x + self.size - 1, y + self.size - 1),
            (x + self.size / 2, y + self.size / 2),
        ]

        return all(is_walkable_at(px, py) for px, py in corners)

    def draw(self, surface: pygame.Surface, camera) -> None:
        screen_rect = camera.apply(self.rect)
        pygame.draw.rect(surface, self.color, screen_rect)
