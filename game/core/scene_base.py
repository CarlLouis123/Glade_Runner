# game/core/scene_base.py
import pygame
from abc import ABC, abstractmethod


class SceneBase(ABC):
    """
    Base class for all scenes (e.g. main menu, gameplay, pause menu).
    """

    def __init__(self, app):
        self.app = app
        self.is_paused = False

    @abstractmethod
    def handle_event(self, event: pygame.event.Event) -> None:
        """Process a single Pygame event."""
        raise NotImplementedError

    @abstractmethod
    def update(self, dt: float) -> None:
        """Update scene logic."""
        raise NotImplementedError

    @abstractmethod
    def draw(self, surface: pygame.Surface) -> None:
        """Draw the scene."""
        raise NotImplementedError

    def on_enter(self, prev_scene: "SceneBase | None") -> None:
        """Called when this scene becomes active."""
        pass

    def on_exit(self, next_scene: "SceneBase | None") -> None:
        """Called when this scene is no longer active."""
        pass
