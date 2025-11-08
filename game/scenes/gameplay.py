# game/scenes/gameplay.py
from __future__ import annotations

import math
import random
from typing import Dict, List, Tuple

import pygame

from game.core.camera import Camera
from game.core.scene_base import SceneBase
from game.entities.player import Player
from game.world import tiles


TileCoord = Tuple[int, int]


class GameplayScene(SceneBase):
    """Core top-down exploration scene for Glade Runner."""

    def __init__(self, app):
        super().__init__(app)

        settings = app.settings
        base_world_width = settings.WORLD_WIDTH
        base_world_height = settings.WORLD_HEIGHT

        self.tile_size = 40
        self.map_width = max(1, base_world_width // self.tile_size)
        self.map_height = max(1, base_world_height // self.tile_size)
        self.world_width = self.map_width * self.tile_size
        self.world_height = self.map_height * self.tile_size

        self.tilemap, self.region_map, layout_info = self.generate_world_layout()

        self.spawn_tiles: Dict[str, TileCoord] = layout_info["spawn_tiles"]
        self.volcano_center_tile: TileCoord = layout_info["volcano_center_tile"]
        self.town_unlock_tile: TileCoord = layout_info["town_unlock_tile"]
        self.forest_unlock_tile: TileCoord = layout_info["forest_unlock_tile"]
        self.gate_tiles: Dict[str, List[TileCoord]] = layout_info["gate_tiles"]
        self.volcano_gate_tile: TileCoord = layout_info["volcano_gate_tile"]

        spawn_center = self._tile_center(self.spawn_tiles["town_center"])
        player_size = 32
        self.player = Player(
            spawn_center[0] - player_size / 2,
            spawn_center[1] - player_size / 2,
            size=player_size,
        )

        self.bg_color = (16, 60, 40)

        self.camera = Camera(
            world_width=self.world_width,
            world_height=self.world_height,
            screen_width=self.app.screen_rect.width,
            screen_height=self.app.screen_rect.height,
        )

        self.hud_font = pygame.font.SysFont("consolas", 20)
        self.banner_font = pygame.font.SysFont("consolas", 32)

        self.active_messages: List[dict[str, float | str]] = []
        self.region_banner_text = ""
        self.region_banner_timer = 0.0

        self.unlocked_forest = False
        self.unlocked_farm = False
        self.unlocked_mountains = False
        self.unlocked_volcano = False
        self.visited_mountains = False
        self.open_gates: set[str] = set()

        self.current_region = "none"

        self.ambient_sounds = {
            "forest": self.app.resources.load_sound("forest_ambient.ogg"),
            "farm": self.app.resources.load_sound("farm_ambient.ogg"),
            "town": self.app.resources.load_sound("town_ambient.ogg"),
            "mountain": self.app.resources.load_sound("mountain_wind.ogg"),
            "volcano": self.app.resources.load_sound("volcano_rumble.ogg"),
        }
        self.current_ambient_key: str | None = None
        self.ambient_channel: pygame.mixer.Channel | None = None

        self._update_current_region(0.0, force=True)

    # ------------------------------------------------------------------
    # Scene lifecycle
    # ------------------------------------------------------------------
    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.app.quit()
            return

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                from game.scenes.main_menu import MainMenuScene

                self.app.change_scene(MainMenuScene(self.app))
                return

            teleport_keys = {
                pygame.K_F5: "town_center",
                pygame.K_F6: "forest_camp",
                pygame.K_F7: "farm_square",
                pygame.K_F8: "mountain_pass",
                pygame.K_F9: "volcano_rim",
            }
            if event.key in teleport_keys:
                self._teleport_to(teleport_keys[event.key])

    def update(self, dt: float) -> None:
        self.player.update(
            dt,
            self.world_width,
            self.world_height,
            self.is_walkable_at,
        )
        self.camera.update(self.player.rect)

        self._update_current_region(dt)
        self._update_progression()
        self._update_messages(dt)
        self._update_region_banner(dt)

    def draw(self, surface: pygame.Surface) -> None:
        surface.fill(self.bg_color)

        ticks = pygame.time.get_ticks()
        lava_centers: list[Tuple[int, int]] = []

        for y, row in enumerate(self.tilemap):
            for x, tile_id in enumerate(row):
                tile_rect = pygame.Rect(
                    x * self.tile_size,
                    y * self.tile_size,
                    self.tile_size,
                    self.tile_size,
                )
                screen_rect = self.camera.apply(tile_rect)

                tile_def = tiles.get_tile_def(tile_id)
                color = tile_def.color
                if tile_id == tiles.LAVA:
                    variation = 35 * (
                        0.5
                        + 0.5
                        * math.sin((ticks / 180.0) + x * 0.8 + y * 1.1)
                    )
                    color = (
                        min(255, int(tile_def.color[0] + variation)),
                        int(tile_def.color[1] + variation * 0.15),
                        max(0, int(tile_def.color[2] - variation * 0.5)),
                    )

                pygame.draw.rect(surface, color, screen_rect)

                region = self.region_map[y][x]

                if region == "forest" and tile_id == tiles.FOREST:
                    self._draw_forest_detail(surface, screen_rect, x, y)
                elif region == "farm" and tile_id == tiles.FARM_FIELD:
                    self._draw_farm_detail(surface, screen_rect, x, y)
                elif region == "town":
                    self._draw_town_detail(surface, screen_rect, tile_id, x, y)
                elif region == "mountain" and tile_id == tiles.MOUNTAIN:
                    self._draw_mountain_detail(surface, screen_rect, x, y)
                elif region == "volcano":
                    if tile_id == tiles.LAVA:
                        lava_centers.append(screen_rect.center)
                    elif tile_id == tiles.VOLCANO_ROCK:
                        self._draw_volcano_rock(surface, screen_rect, x, y)

        if lava_centers:
            self._draw_volcano_smoke(surface, lava_centers, ticks)

        self.player.draw(surface, self.camera)

        self._draw_hud(surface)

    # ------------------------------------------------------------------
    # World generation
    # ------------------------------------------------------------------
    def generate_world_layout(
        self,
    ) -> tuple[list[list[int]], list[list[str]], dict[str, object]]:
        width = self.map_width
        height = self.map_height

        tilemap: list[list[int]] = [
            [tiles.DEEP_WATER for _ in range(width)] for _ in range(height)
        ]
        region_map: list[list[str]] = [["none" for _ in range(width)] for _ in range(height)]
        land_mask: list[list[bool]] = [
            [False for _ in range(width)] for _ in range(height)
        ]

        center_x = width / 2
        center_y = height / 2
        radius_x = width * 0.42
        radius_y = height * 0.36

        for y in range(height):
            for x in range(width):
                dx = (x - center_x) / radius_x
                dy = (y - center_y) / radius_y
                shape = dx * dx + dy * dy
                noise = (
                    math.sin(x * 0.18) * 0.08
                    + math.cos(y * 0.22) * 0.08
                    + math.sin((x + y) * 0.13) * 0.05
                )
                threshold = 1.0 - 0.08 + noise
                if shape < threshold:
                    land_mask[y][x] = True

        for y in range(height):
            for x in range(width):
                if not land_mask[y][x]:
                    continue

                neighbours = [
                    (x + 1, y),
                    (x - 1, y),
                    (x, y + 1),
                    (x, y - 1),
                    (x + 1, y + 1),
                    (x - 1, y - 1),
                    (x + 1, y - 1),
                    (x - 1, y + 1),
                ]
                if any(
                    not (0 <= nx < width and 0 <= ny < height) or not land_mask[ny][nx]
                    for nx, ny in neighbours
                ):
                    tilemap[y][x] = tiles.BEACH_SAND
                else:
                    tilemap[y][x] = tiles.GRASS

        volcano_center = (int(width * 0.55), int(height * 0.28))
        volcano_inner_radius = 3
        volcano_outer_radius = 7

        def set_tile(x: int, y: int, tile_id: int, region: str | None = None) -> None:
            if not (0 <= x < width and 0 <= y < height):
                return
            tilemap[y][x] = tile_id
            if tile_id in (tiles.DEEP_WATER, tiles.SHALLOW_WATER):
                land_mask[y][x] = False
            else:
                land_mask[y][x] = True
            if region is not None:
                region_map[y][x] = region

        river_width = 3
        west_bend = volcano_center[0] - volcano_outer_radius - 3
        east_branch = volcano_center[0] + volcano_outer_radius + 3
        top_connector_y = volcano_center[1] - volcano_outer_radius - 3
        bottom_connector_y = volcano_center[1] + volcano_outer_radius + 3

        for y in range(height):
            if y < top_connector_y:
                center = int(width * 0.48 + math.sin(y / 16.0) * 3)
            elif y <= bottom_connector_y:
                center = west_bend
            else:
                center = int(width * 0.52 + math.sin(y / 18.0) * 2)

            for dx in range(-river_width, river_width + 1):
                set_tile(center + dx, y, tiles.SHALLOW_WATER)

        for y in range(top_connector_y, bottom_connector_y + 1):
            for dx in range(-2, 3):
                set_tile(east_branch + dx, y, tiles.SHALLOW_WATER)

        for x in range(min(west_bend, east_branch) - river_width, max(west_bend, east_branch) + river_width + 1):
            set_tile(x, top_connector_y, tiles.SHALLOW_WATER)
            set_tile(x, bottom_connector_y, tiles.SHALLOW_WATER)

        for y in range(
            volcano_center[1] - volcano_outer_radius - 1,
            volcano_center[1] + volcano_outer_radius + 2,
        ):
            for x in range(
                volcano_center[0] - volcano_outer_radius - 1,
                volcano_center[0] + volcano_outer_radius + 2,
            ):
                dist_sq = (x - volcano_center[0]) ** 2 + (y - volcano_center[1]) ** 2
                if volcano_inner_radius ** 2 <= dist_sq <= volcano_outer_radius ** 2:
                    set_tile(x, y, tiles.SHALLOW_WATER)

        bridge_tiles: list[TileCoord] = [
            (int(width * 0.5), int(height * 0.66)),
            (east_branch, volcano_center[1]),
            (int(width * 0.52), bottom_connector_y - 1),
        ]
        for bx, by in bridge_tiles:
            if not (0 <= bx < width and 0 <= by < height):
                continue
            for dx in range(-river_width, river_width + 1):
                if dx == 0:
                    continue
                nx = bx + dx
                if 0 <= nx < width and 0 <= by < height and tilemap[by][nx] == tiles.SHALLOW_WATER:
                    tilemap[by][nx] = tiles.GRASS
                    land_mask[by][nx] = True
            tilemap[by][bx] = tiles.ROAD
            land_mask[by][bx] = True

        forest_left = int(width * 0.18)
        forest_right = int(width * 0.38)
        forest_top = int(height * 0.4)
        forest_bottom = int(height * 0.7)
        forest_center_x = (forest_left + forest_right) // 2
        forest_center_y = (forest_top + forest_bottom) // 2
        for y in range(forest_top, forest_bottom):
            for x in range(forest_left, forest_right):
                if not land_mask[y][x]:
                    continue
                region_map[y][x] = "forest"
                if tilemap[y][x] != tiles.ROAD:
                    tilemap[y][x] = tiles.FOREST
                if (
                    abs(x - forest_center_x) <= 1
                    or abs(y - forest_center_y) <= 1
                    or ((x - forest_left) % 6 == 0 and (y - forest_top) % 5 == 0)
                ):
                    tilemap[y][x] = tiles.GRASS

        farm_left = int(width * 0.42)
        farm_right = int(width * 0.62)
        farm_top = int(height * 0.68)
        farm_bottom = int(height * 0.86)
        farm_center_x = (farm_left + farm_right) // 2
        for y in range(farm_top, farm_bottom):
            for x in range(farm_left, farm_right):
                if not land_mask[y][x]:
                    continue
                region_map[y][x] = "farm"
                if tilemap[y][x] == tiles.ROAD:
                    continue
                if (
                    x in (farm_left, farm_right - 1)
                    or y in (farm_top, farm_bottom - 1)
                ):
                    tilemap[y][x] = tiles.TOWN_WALL
                else:
                    if (x - farm_left) % 5 == 0 or (y - farm_top) % 4 == 0:
                        tilemap[y][x] = tiles.ROAD
                    else:
                        tilemap[y][x] = tiles.FARM_FIELD

        town_left = int(width * 0.66)
        town_right = int(width * 0.88)
        town_top = int(height * 0.6)
        town_bottom = int(height * 0.82)
        town_center_x = (town_left + town_right) // 2
        town_center_y = (town_top + town_bottom) // 2
        for y in range(town_top, town_bottom):
            for x in range(town_left, town_right):
                if not land_mask[y][x]:
                    continue
                region_map[y][x] = "town"
                if (
                    x in (town_left, town_right - 1)
                    or y in (town_top, town_bottom - 1)
                ):
                    tilemap[y][x] = tiles.TOWN_WALL
                else:
                    tilemap[y][x] = tiles.TOWN_STONE
        for x in range(town_left + 1, town_right - 1):
            tilemap[town_center_y][x] = tiles.ROAD
            region_map[town_center_y][x] = "town"
        for y in range(town_top + 1, town_bottom - 1):
            tilemap[y][town_center_x] = tiles.ROAD
            region_map[y][town_center_x] = "town"
        for y in range(town_center_y - 1, town_center_y + 2):
            for x in range(town_center_x - 1, town_center_x + 2):
                tilemap[y][x] = tiles.TOWN_STONE
                region_map[y][x] = "town"

        mountain_left = int(width * 0.68)
        mountain_right = int(width * 0.88)
        mountain_top = int(height * 0.2)
        mountain_bottom = int(height * 0.42)
        mountain_center_x = (mountain_left + mountain_right) // 2
        for y in range(mountain_top, mountain_bottom):
            for x in range(mountain_left, mountain_right):
                if not land_mask[y][x]:
                    continue
                region_map[y][x] = "mountain"
                tilemap[y][x] = tiles.MOUNTAIN
        for y in range(mountain_top, mountain_bottom):
            tilemap[y][mountain_center_x] = tiles.ROAD
            region_map[y][mountain_center_x] = "mountain"
        for x in range(mountain_left, mountain_right):
            ridge_y = mountain_top + (x - mountain_left) // 3
            if mountain_top <= ridge_y < mountain_bottom:
                tilemap[ridge_y][x] = tiles.MOUNTAIN
                region_map[ridge_y][x] = "mountain"

        rim_inner_sq = (volcano_inner_radius + 1) ** 2
        rim_outer_sq = (volcano_inner_radius + 2) ** 2
        for y in range(
            volcano_center[1] - volcano_outer_radius,
            volcano_center[1] + volcano_outer_radius + 1,
        ):
            for x in range(
                volcano_center[0] - volcano_outer_radius,
                volcano_center[0] + volcano_outer_radius + 1,
            ):
                dist_sq = (x - volcano_center[0]) ** 2 + (y - volcano_center[1]) ** 2
                if dist_sq <= volcano_inner_radius ** 2:
                    set_tile(x, y, tiles.LAVA, "volcano")
                elif dist_sq <= volcano_outer_radius ** 2:
                    set_tile(x, y, tiles.VOLCANO_ROCK, "volcano")
                if rim_inner_sq <= dist_sq <= rim_outer_sq:
                    tilemap[y][x] = tiles.ROAD
                    region_map[y][x] = "volcano"
        for y in range(volcano_center[1] + volcano_inner_radius + 2, volcano_center[1] + volcano_outer_radius + 1):
            set_tile(volcano_center[0], y, tiles.ROAD, "volcano")

        def carve_road_line(start: TileCoord, end: TileCoord) -> None:
            x0, y0 = start
            x1, y1 = end
            steps = max(abs(x1 - x0), abs(y1 - y0))
            if steps == 0:
                steps = 1
            for step in range(steps + 1):
                t = step / steps
                x = int(round(x0 + (x1 - x0) * t))
                y = int(round(y0 + (y1 - y0) * t))
                if 0 <= x < width and 0 <= y < height:
                    tilemap[y][x] = tiles.ROAD

        town_gate_tile = (town_left, town_center_y)
        forest_gate_tile = (forest_center_x, forest_top)
        farm_gate_tile = (farm_center_x, farm_top)
        mountain_gate_tile = (mountain_center_x, mountain_bottom - 1)
        volcano_gate_tile = (volcano_center[0], volcano_center[1] + volcano_outer_radius + 1)

        carve_road_line((town_gate_tile[0] - 1, town_gate_tile[1]), (int(width * 0.6), int(height * 0.66)))
        carve_road_line((int(width * 0.6), int(height * 0.66)), (int(width * 0.5), int(height * 0.66)))
        carve_road_line((int(width * 0.5), int(height * 0.66)), (forest_center_x + 6, int(height * 0.62)))
        carve_road_line((forest_center_x + 6, int(height * 0.62)), (forest_center_x, forest_center_y))
        carve_road_line((forest_center_x, forest_center_y + 2), (farm_center_x, farm_gate_tile[1] - 1))
        carve_road_line((farm_center_x, farm_gate_tile[1] + 1), (farm_center_x, farm_bottom - 2))
        carve_road_line((farm_center_x, farm_gate_tile[1] - 1), (int(width * 0.6), int(height * 0.63)))
        carve_road_line((int(width * 0.6), int(height * 0.63)), (mountain_center_x, mountain_gate_tile[1] + 1))
        carve_road_line((mountain_center_x, mountain_gate_tile[1] - 1), (mountain_center_x, mountain_top + 1))
        carve_road_line((mountain_center_x, mountain_top + 1), (volcano_gate_tile[0], volcano_gate_tile[1] - 1))

        layout_gate_tiles = {
            "forest": [town_gate_tile],
            "farm": [farm_gate_tile],
            "mountain": [mountain_gate_tile],
            "volcano": [volcano_gate_tile],
        }

        for gate_list in layout_gate_tiles.values():
            for gx, gy in gate_list:
                if 0 <= gx < width and 0 <= gy < height:
                    tilemap[gy][gx] = tiles.GATE

        spawn_tiles = {
            "town_center": (town_center_x, town_center_y),
            "forest_camp": (forest_center_x, forest_center_y),
            "farm_square": (farm_center_x, (farm_top + farm_bottom) // 2),
            "mountain_pass": (mountain_center_x, mountain_top + 2),
            "volcano_rim": (volcano_center[0], volcano_center[1] + volcano_inner_radius + 2),
        }

        layout_info = {
            "spawn_tiles": spawn_tiles,
            "volcano_center_tile": volcano_center,
            "town_unlock_tile": (town_center_x, town_center_y),
            "forest_unlock_tile": (forest_center_x, forest_center_y),
            "gate_tiles": layout_gate_tiles,
            "volcano_gate_tile": volcano_gate_tile,
        }

        return tilemap, region_map, layout_info

    # ------------------------------------------------------------------
    # Region & progression helpers
    # ------------------------------------------------------------------
    def _update_current_region(self, dt: float, force: bool = False) -> None:
        player_center = (
            self.player.pos.x + self.player.size / 2,
            self.player.pos.y + self.player.size / 2,
        )
        region = self._get_region_at_world(player_center[0], player_center[1])
        previous = self.current_region
        changed = force or region != previous
        if changed:
            self.current_region = region
            if not force and region != previous:
                display = self._format_region_name(region)
                self.region_banner_text = f"Entering: {display}"
                self.region_banner_timer = 2.0
            self._on_region_changed(previous, region)

    def _on_region_changed(self, previous: str, current: str) -> None:
        self._switch_ambient_sound(current)
        if current == "mountain" and not self.visited_mountains:
            self.visited_mountains = True
            if not self.unlocked_volcano:
                self.unlocked_volcano = True
                self._open_gate("volcano")
                self.add_message("Volcano path unlocked!", duration=2.5)

    def _update_progression(self) -> None:
        player_tile = self._world_to_tile(
            self.player.pos.x + self.player.size / 2,
            self.player.pos.y + self.player.size / 2,
        )

        if not self.unlocked_forest and player_tile == self.town_unlock_tile:
            self.unlocked_forest = True
            self._open_gate("forest")
            self.add_message("Forest gate unlocked!", duration=2.5)

        if (
            self.unlocked_forest
            and not self.unlocked_farm
            and player_tile == self.forest_unlock_tile
        ):
            self.unlocked_farm = True
            self.unlocked_mountains = True
            self._open_gate("farm")
            self._open_gate("mountain")
            self.add_message("Paths to the farm and mountains open!", duration=2.5)

    def _open_gate(self, gate_name: str) -> None:
        if gate_name in self.open_gates:
            return
        for gx, gy in self.gate_tiles.get(gate_name, []):
            if 0 <= gx < self.map_width and 0 <= gy < self.map_height:
                self.tilemap[gy][gx] = tiles.ROAD
        self.open_gates.add(gate_name)

    def _update_messages(self, dt: float) -> None:
        for message in self.active_messages:
            message["timer"] -= dt
        self.active_messages = [m for m in self.active_messages if m["timer"] > 0]

    def _update_region_banner(self, dt: float) -> None:
        if self.region_banner_timer > 0:
            self.region_banner_timer -= dt
            if self.region_banner_timer <= 0:
                self.region_banner_text = ""

    # ------------------------------------------------------------------
    # Rendering helpers / HUD
    # ------------------------------------------------------------------
    def _draw_hud(self, surface: pygame.Surface) -> None:
        fps = int(self.app.clock.get_fps())
        region_name = self._format_region_name(self.current_region)
        text = f"FPS: {fps} | Pos: ({int(self.player.pos.x)}, {int(self.player.pos.y)}) | Region: {region_name}"
        hud_surf = self.hud_font.render(text, True, (240, 255, 240))
        surface.blit(hud_surf, (10, 10))

        if self.region_banner_text and self.region_banner_timer > 0:
            banner_surf = self.banner_font.render(self.region_banner_text, True, (255, 255, 220))
            banner_rect = banner_surf.get_rect(
                center=(surface.get_width() // 2, 40)
            )
            surface.blit(banner_surf, banner_rect)

        message_y = 40
        for message in self.active_messages:
            msg_surf = self.hud_font.render(str(message["text"]), True, (230, 230, 210))
            surface.blit(msg_surf, (10, message_y))
            message_y += msg_surf.get_height() + 4

        self._draw_minimap(surface)

    def _draw_minimap(self, surface: pygame.Surface) -> None:
        size = 160
        minimap = pygame.Surface((size, size), pygame.SRCALPHA)
        scale_x = size / self.map_width
        scale_y = size / self.map_height
        radius = size // 2
        center = pygame.Vector2(radius, radius)
        cell_w = max(1, int(math.ceil(scale_x)))
        cell_h = max(1, int(math.ceil(scale_y)))

        for y in range(self.map_height):
            for x in range(self.map_width):
                tile_id = self.tilemap[y][x]
                color = tiles.get_tile_def(tile_id).color
                region = self.region_map[y][x]
                if region != "none" and tile_id not in (tiles.DEEP_WATER, tiles.SHALLOW_WATER):
                    color = tuple(min(255, int(c + 25)) for c in color)
                px = int(x * scale_x)
                py = int(y * scale_y)
                rect = pygame.Rect(px, py, cell_w, cell_h)
                tile_center = pygame.Vector2(rect.centerx, rect.centery)
                if tile_center.distance_to(center) <= radius:
                    minimap.fill(color, rect)

        pygame.draw.circle(minimap, (255, 255, 255, 160), (radius, radius), radius, width=2)

        player_tile = self._world_to_tile(
            self.player.pos.x + self.player.size / 2,
            self.player.pos.y + self.player.size / 2,
        )
        player_px = int(player_tile[0] * scale_x + cell_w / 2)
        player_py = int(player_tile[1] * scale_y + cell_h / 2)
        if (player_px - radius) ** 2 + (player_py - radius) ** 2 <= radius ** 2:
            pygame.draw.circle(minimap, (255, 80, 80), (player_px, player_py), 4)

        dest_x = surface.get_width() - size - 10
        surface.blit(minimap, (dest_x, 10))

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------
    def _format_region_name(self, region: str) -> str:
        if not region or region == "none":
            return "Wilds"
        return region.replace("_", " ").title()

    def _get_region_at_world(self, world_x: float, world_y: float) -> str:
        if not (0 <= world_x < self.world_width and 0 <= world_y < self.world_height):
            return "none"
        tile_x = int(world_x // self.tile_size)
        tile_y = int(world_y // self.tile_size)
        return self.region_map[tile_y][tile_x]

    def _world_to_tile(self, world_x: float, world_y: float) -> TileCoord:
        tile_x = int(max(0, min(self.world_width - 1, world_x)) // self.tile_size)
        tile_y = int(max(0, min(self.world_height - 1, world_y)) // self.tile_size)
        return tile_x, tile_y

    def _tile_center(self, tile: TileCoord) -> Tuple[float, float]:
        x, y = tile
        return (
            x * self.tile_size + self.tile_size / 2,
            y * self.tile_size + self.tile_size / 2,
        )

    def is_walkable_at(self, world_x: float, world_y: float) -> bool:
        if not (0 <= world_x < self.world_width and 0 <= world_y < self.world_height):
            return False
        tile_x = int(world_x // self.tile_size)
        tile_y = int(world_y // self.tile_size)
        tile_id = self.tilemap[tile_y][tile_x]
        return tiles.get_tile_def(tile_id).walkable

    def _teleport_to(self, spawn_name: str) -> None:
        tile = self.spawn_tiles.get(spawn_name)
        if tile is None:
            return
        center = self._tile_center(tile)
        self.player.pos.update(
            center[0] - self.player.size / 2,
            center[1] - self.player.size / 2,
        )
        self.player.rect.topleft = (int(self.player.pos.x), int(self.player.pos.y))
        self.camera.update(self.player.rect)
        self._update_current_region(0.0, force=True)
        label = spawn_name.replace("_", " ").title()
        self.add_message(f"Teleported to {label}")

    def _switch_ambient_sound(self, region: str) -> None:
        target_key = region if region in self.ambient_sounds else None
        if target_key == self.current_ambient_key:
            return
        if self.ambient_channel:
            self.ambient_channel.stop()
            self.ambient_channel = None
        if target_key is not None:
            sound = self.ambient_sounds.get(target_key)
            if sound is not None:
                try:
                    self.ambient_channel = sound.play(loops=-1)
                except pygame.error:
                    self.ambient_channel = None
        self.current_ambient_key = target_key

    def add_message(self, text: str, duration: float = 2.0) -> None:
        self.active_messages.append({"text": text, "timer": duration})

    # ------------------------------------------------------------------
    # Detail drawing helpers
    # ------------------------------------------------------------------
    def _draw_forest_detail(
        self,
        surface: pygame.Surface,
        rect: pygame.Rect,
        tile_x: int,
        tile_y: int,
    ) -> None:
        rng = random.Random((tile_x << 16) ^ tile_y)
        for _ in range(2):
            radius = rng.randint(max(3, self.tile_size // 6), max(4, self.tile_size // 4))
            offset_x = rng.randint(radius, self.tile_size - radius)
            offset_y = rng.randint(radius, self.tile_size - radius)
            center = (rect.x + offset_x, rect.y + offset_y)
            pygame.draw.circle(surface, (20, 70, 32), center, radius)

    def _draw_farm_detail(
        self,
        surface: pygame.Surface,
        rect: pygame.Rect,
        tile_x: int,
        tile_y: int,
    ) -> None:
        line_color = (180, 160, 110)
        step = max(4, self.tile_size // 5)
        for i in range(1, 4):
            pygame.draw.line(
                surface,
                line_color,
                (rect.left, rect.top + i * step),
                (rect.right, rect.top + i * step),
                1,
            )
            pygame.draw.line(
                surface,
                line_color,
                (rect.left + i * step, rect.top),
                (rect.left + i * step, rect.bottom),
                1,
            )
        rng = random.Random(tile_x * 92821 + tile_y * 68917)
        crop_w = max(4, self.tile_size // 5)
        crop_h = max(6, self.tile_size // 3)
        crop_rect = pygame.Rect(
            rect.left + rng.randint(2, max(2, self.tile_size - crop_w - 2)),
            rect.top + rng.randint(2, max(2, self.tile_size - crop_h - 2)),
            crop_w,
            crop_h,
        )
        pygame.draw.rect(surface, (205, 190, 120), crop_rect, border_radius=3)

    def _draw_town_detail(
        self,
        surface: pygame.Surface,
        rect: pygame.Rect,
        tile_id: int,
        tile_x: int,
        tile_y: int,
    ) -> None:
        if tile_id == tiles.TOWN_WALL:
            pygame.draw.rect(surface, (60, 60, 85), rect)
            pygame.draw.rect(surface, (130, 130, 150), rect, 2)
            return
        if tile_id == tiles.ROAD:
            pygame.draw.rect(surface, (120, 120, 140), rect, 1)
            return
        if tile_id != tiles.TOWN_STONE:
            return
        rng = random.Random(tile_x * 19349663 + tile_y * 83492791)
        if rng.random() < 0.35:
            house_w = int(self.tile_size * 0.6)
            house_h = int(self.tile_size * 0.45)
            house_rect = pygame.Rect(
                rect.centerx - house_w // 2,
                rect.centery - house_h // 2 + 4,
                house_w,
                house_h,
            )
            pygame.draw.rect(surface, (185, 150, 120), house_rect)
            roof_points = [
                (house_rect.left, house_rect.top),
                (house_rect.right, house_rect.top),
                (house_rect.centerx, house_rect.top - house_h // 2),
            ]
            pygame.draw.polygon(surface, (120, 70, 50), roof_points)

    def _draw_mountain_detail(
        self,
        surface: pygame.Surface,
        rect: pygame.Rect,
        tile_x: int,
        tile_y: int,
    ) -> None:
        peak = (rect.centerx, rect.top + self.tile_size // 6)
        left = (rect.left + self.tile_size // 6, rect.bottom)
        right = (rect.right - self.tile_size // 6, rect.bottom)
        pygame.draw.polygon(surface, (140, 140, 150), [left, peak, right])
        pygame.draw.line(surface, (200, 200, 210), peak, (rect.centerx, rect.bottom), 1)

    def _draw_volcano_rock(
        self,
        surface: pygame.Surface,
        rect: pygame.Rect,
        tile_x: int,
        tile_y: int,
    ) -> None:
        rng = random.Random((tile_x * 3217) ^ (tile_y * 5279))
        if rng.random() < 0.5:
            start = (rect.left + rng.randint(4, self.tile_size - 4), rect.top)
            end = (start[0] + rng.randint(-5, 5), rect.bottom)
            pygame.draw.line(surface, (120, 80, 70), start, end, 2)

    def _draw_volcano_smoke(
        self,
        surface: pygame.Surface,
        centers: list[Tuple[int, int]],
        ticks: int,
    ) -> None:
        avg_x = sum(x for x, _ in centers) / len(centers)
        avg_y = sum(y for _, y in centers) / len(centers)
        for i in range(3):
            radius = 18 + i * 10
            smoke = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
            pulsate = 120 - i * 25 + int(10 * math.sin((ticks / 400.0) + i))
            alpha = max(40, min(200, pulsate))
            pygame.draw.circle(smoke, (190, 190, 190, alpha), (radius, radius), radius)
            offset_y = avg_y - (i + 1) * 25 - math.sin((ticks / 600.0) + i) * 6
            surface.blit(smoke, (avg_x - radius, offset_y))
