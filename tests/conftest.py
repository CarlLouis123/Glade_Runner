"""Pytest configuration for Glade Runner tests."""
from __future__ import annotations

import os

import pytest

_PREVIOUS_ENV: dict[str, str | None] = {
    "ARCADE_HEADLESS": os.environ.get("ARCADE_HEADLESS"),
    "PYGLET_HEADLESS": os.environ.get("PYGLET_HEADLESS"),
    "ARCADE_HEADLESS_DISABLED": os.environ.get("ARCADE_HEADLESS_DISABLED"),
}

os.environ["ARCADE_HEADLESS"] = "True"
os.environ["PYGLET_HEADLESS"] = "True"
os.environ.pop("ARCADE_HEADLESS_DISABLED", None)

try:
    import pyglet  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when pyglet isn't installed
    pyglet = None  # type: ignore
    _PREVIOUS_HEADLESS = None
else:
    _PREVIOUS_HEADLESS = pyglet.options.get("headless")
    pyglet.options["headless"] = True


def _restore_environment() -> None:
    for key, value in _PREVIOUS_ENV.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value

    if pyglet is not None:
        if _PREVIOUS_HEADLESS is None:
            pyglet.options["headless"] = False
        else:
            pyglet.options["headless"] = _PREVIOUS_HEADLESS


@pytest.hookimpl(trylast=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:  # pragma: no cover - pytest hook
    _restore_environment()
