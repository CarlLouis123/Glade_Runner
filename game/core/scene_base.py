"""Base scene/View abstraction for the Arcade implementation."""
from __future__ import annotations

from typing import TYPE_CHECKING

import arcade

from game.core.headless import is_headless_runtime

if TYPE_CHECKING:  # pragma: no cover - for type checking only
    from .resource_manager import ResourceManager


class SceneBase(arcade.View):
    """Base class for all Glade Runner views."""

    def __init__(self, window: arcade.Window, resources: "ResourceManager") -> None:
        super().__init__(window)
        self.resources = resources
        self._headless_message_emitted = False

    @property
    def game_window(self) -> arcade.Window:
        """Return the :class:`arcade.Window` this view belongs to."""

        assert self.window is not None
        return self.window

    def _emit_headless_message(self, message: str) -> None:
        """Print a one-off textual preview when running without a window."""

        if self._headless_message_emitted or not is_headless_runtime():
            return

        cleaned = message.strip("\n")
        if cleaned:
            print()
            print(cleaned)
        self._headless_message_emitted = True
