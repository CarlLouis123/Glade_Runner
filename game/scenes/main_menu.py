# game/scenes/main_menu.py
import pygame
from game.core.scene_base import SceneBase
from game.scenes.gameplay import GameplayScene


class MainMenuScene(SceneBase):
    """
    Simple starter main menu.
    Press ENTER to start the game. ESC to quit.
    """

    def __init__(self, app):
        super().__init__(app)
        self.title_font = pygame.font.SysFont("arial", 64)
        self.menu_font = pygame.font.SysFont("arial", 32)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.app.quit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.app.quit()
            elif event.key in (pygame.K_RETURN, pygame.K_SPACE):
                self.app.change_scene(GameplayScene(self.app))

    def update(self, dt: float) -> None:
        pass  # Add menu animations here later

    def draw(self, surface: pygame.Surface) -> None:
        surface.fill((10, 20, 30))

        title_surf = self.title_font.render("Glade Runner", True, (200, 240, 255))
        title_rect = title_surf.get_rect(center=(self.app.screen_rect.centerx, 200))
        surface.blit(title_surf, title_rect)

        msg = "Press ENTER to start"
        msg_surf = self.menu_font.render(msg, True, (220, 220, 220))
        msg_rect = msg_surf.get_rect(center=(self.app.screen_rect.centerx, 350))
        surface.blit(msg_surf, msg_rect)

        hint = "ESC to quit"
        hint_surf = self.menu_font.render(hint, True, (180, 180, 180))
        hint_rect = hint_surf.get_rect(center=(self.app.screen_rect.centerx, 400))
        surface.blit(hint_surf, hint_rect)
