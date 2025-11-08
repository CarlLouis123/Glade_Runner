# game/core/camera.py
import pygame


class Camera:
    """
    Simple 2D camera that follows a target within world bounds.
    """

    def __init__(self, world_width: int, world_height: int, screen_width: int, screen_height: int):
        self.world_width = world_width
        self.world_height = world_height
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.offset = pygame.Vector2(0, 0)

    def update(self, target_rect: pygame.Rect) -> None:
        # Center camera on target
        self.offset.x = target_rect.centerx - self.screen_width // 2
        self.offset.y = target_rect.centery - self.screen_height // 2

        # Clamp to world
        self.offset.x = max(0, min(self.offset.x, self.world_width - self.screen_width))
        self.offset.y = max(0, min(self.offset.y, self.world_height - self.screen_height))

    def apply(self, rect: pygame.Rect) -> pygame.Rect:
        """Return a new rect translated by the camera offset."""
        return rect.move(-self.offset.x, -self.offset.y)
