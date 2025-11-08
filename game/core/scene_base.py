"""Base scene/View abstraction for the Arcade implementation."""
from __future__ import annotations

from typing import TYPE_CHECKING

import arcade

if TYPE_CHECKING:  # pragma: no cover - for type checking only
    from .resource_manager import ResourceManager


class SceneBase(arcade.View):
    """Base class for all Glade Runner views."""

    def __init__(self, window: arcade.Window, resources: "ResourceManager") -> None:
        super().__init__(window)
        self.resources = resources

    @property
    def game_window(self) -> arcade.Window:
        """Return the :class:`arcade.Window` this view belongs to."""

        assert self.window is not None
        return self.window
