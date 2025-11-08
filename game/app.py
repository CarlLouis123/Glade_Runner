# game/app.py
import pygame
from config.settings import Settings
from game.core.scene_base import SceneBase
from game.core.resource_manager import ResourceManager
from game.scenes.main_menu import MainMenuScene


class GameApp:
    """
    Core application harness for Glade Runner.
    Handles initialization, main loop, scene management.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

        pygame.init()
        pygame.mixer.init()

        flags = 0
        if settings.VSYNC:
            flags |= pygame.SCALED  # or pygame.SCALED|pygame.FULLSCREEN depending on preference

        self.screen = pygame.display.set_mode(
            (settings.WINDOW_WIDTH, settings.WINDOW_HEIGHT),
            flags,
        )
        pygame.display.set_caption(settings.WINDOW_TITLE)

        self.screen_rect = self.screen.get_rect()
        self.clock = pygame.time.Clock()
        self.running = False

        # Resources
        self.resources = ResourceManager(
            images_dir=settings.IMAGES_DIR,
            sounds_dir=settings.SOUNDS_DIR,
            fonts_dir=settings.FONTS_DIR,
        )

        # Current scene
        self.active_scene: SceneBase | None = None
        self.change_scene(MainMenuScene(self))

    def change_scene(self, new_scene: SceneBase) -> None:
        """Switch to a new scene, handling enter/exit hooks."""
        if self.active_scene is not None:
            self.active_scene.on_exit(new_scene)

        prev_scene = self.active_scene
        self.active_scene = new_scene
        self.active_scene.on_enter(prev_scene)

    def quit(self) -> None:
        """Gracefully exit the game loop."""
        self.running = False

    def run(self) -> None:
        self.running = True
        while self.running:
            dt = self.clock.tick(self.settings.TARGET_FPS) / 1000.0

            for event in pygame.event.get():
                if self.active_scene:
                    self.active_scene.handle_event(event)

            if self.active_scene:
                self.active_scene.update(dt)
                self.active_scene.draw(self.screen)

            if self.settings.SHOW_FPS_IN_TITLE:
                fps = int(self.clock.get_fps())
                pygame.display.set_caption(f"{self.settings.WINDOW_TITLE} | {fps} FPS")

            pygame.display.flip()

        pygame.quit()
