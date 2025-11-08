# game/scenes/gameplay.py
import pygame
from game.core.scene_base import SceneBase
from game.core.camera import Camera
from game.entities.player import Player


class GameplayScene(SceneBase):
    """
    Core top-down exploration scene for Glade Runner.
    """

    def __init__(self, app):
        super().__init__(app)

        s = app.settings
        self.world_width = s.WORLD_WIDTH
        self.world_height = s.WORLD_HEIGHT

        # Simple world background colour for now
        self.bg_color = (16, 60, 40)

        # Entities
        self.player = Player(self.world_width / 2, self.world_height / 2)

        # Camera following the player
        self.camera = Camera(
            world_width=self.world_width,
            world_height=self.world_height,
            screen_width=self.app.screen_rect.width,
            screen_height=self.app.screen_rect.height,
        )

        # Example: minimal HUD font
        self.hud_font = pygame.font.SysFont("consolas", 20)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.app.quit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                # ESC: go back to main menu for now
                from game.scenes.main_menu import MainMenuScene
                self.app.change_scene(MainMenuScene(self.app))

    def update(self, dt: float) -> None:
        # Update entities
        self.player.update(dt, self.world_width, self.world_height)
        self.camera.update(self.player.rect)

    def draw(self, surface: pygame.Surface) -> None:
        surface.fill(self.bg_color)

        # TODO: draw tilemap / world objects here later
        # Example placeholder: a big rectangle representing the glade
        world_rect = pygame.Rect(0, 0, self.world_width, self.world_height)
        pygame.draw.rect(surface, (20, 80, 50), self.camera.apply(world_rect), 4)

        # Player
        self.player.draw(surface, self.camera)

        # HUD
        self._draw_hud(surface)

    def _draw_hud(self, surface: pygame.Surface) -> None:
        fps = int(self.app.clock.get_fps())
        text = f"FPS: {fps} | Pos: ({int(self.player.pos.x)}, {int(self.player.pos.y)})"
        hud_surf = self.hud_font.render(text, True, (240, 255, 240))
        surface.blit(hud_surf, (10, 10))
