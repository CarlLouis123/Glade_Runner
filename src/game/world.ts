import { TILE_SIZE } from './config';
import { Tilemap, type TilemapData } from '@engine/tilemap';
import type { NavMesh } from '@workers/pathfinding';

export interface SavedState {
  player: {
    x: number;
    y: number;
  };
}

const createTilemapData = (): TilemapData => {
  const width = 20;
  const height = 15;
  const ground = new Array(width * height).fill(1);
  const collision = new Array(width * height).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        collision[y * width + x] = 2;
      }
    }
  }

  [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 5, y: 7 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 12, y: 8 }
  ].forEach(({ x, y }) => {
    collision[y * width + x] = 2;
  });

  return {
    tileSize: TILE_SIZE,
    width,
    height,
    atlasKey: 'tiles',
    layers: [
      { name: 'ground', data: ground },
      { name: 'collision', data: collision }
    ]
  };
};

const buildNavMesh = (tilemap: Tilemap): NavMesh => {
  const nodes: NavMesh['nodes'] = {};
  for (let ty = 0; ty < tilemap.height; ty += 1) {
    for (let tx = 0; tx < tilemap.width; tx += 1) {
      if (tilemap.tileAt('collision', tx, ty) === 2) {
        continue;
      }
      const id = `${tx},${ty}`;
      const neighbors: string[] = [];
      const offsets = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ];
      offsets.forEach(({ dx, dy }) => {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= tilemap.width || ny >= tilemap.height) {
          return;
        }
        if (tilemap.tileAt('collision', nx, ny) === 2) {
          return;
        }
        neighbors.push(`${nx},${ny}`);
      });
      nodes[id] = {
        id,
        x: tx * tilemap.tileSize + tilemap.tileSize / 2,
        y: ty * tilemap.tileSize + tilemap.tileSize / 2,
        neighbors
      };
    }
  }
  return { nodes };
};

export const createWorld = (): { tilemap: Tilemap; navMesh: NavMesh } => {
  const tilemap = new Tilemap(createTilemapData());
  tilemap.setCollisionTiles([2]);
  const navMesh = buildNavMesh(tilemap);
  return { tilemap, navMesh };
};
