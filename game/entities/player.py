# game/entities/player.py
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

    def handle_input(self, dt: float) -> None:
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
            self.pos += movement

        self.rect.topleft = (int(self.pos.x), int(self.pos.y))

    def clamp_to_world(self, world_width: int, world_height: int) -> None:
        self.rect.clamp_ip(pygame.Rect(0, 0, world_width, world_height))
        self.pos.x, self.pos.y = self.rect.topleft

    def update(self, dt: float, world_width: int, world_height: int) -> None:
        self.handle_input(dt)
        self.clamp_to_world(world_width, world_height)

    def draw(self, surface: pygame.Surface, camera) -> None:
        screen_rect = camera.apply(self.rect)
        pygame.draw.rect(surface, self.color, screen_rect)
