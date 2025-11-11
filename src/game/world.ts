import { TILE_SIZE } from './config';
import { Tilemap, type TilemapData } from '@engine/tilemap';
import type { NavMesh } from '@workers/pathfinding';

export interface SavedState {
  player: {
    x: number;
    y: number;
  };
}

export enum GroundTile {
  Meadow = 1,
  Beach = 2,
  Sea = 3,
  Mountain = 4,
  Volcano = 5,
  Forest = 6,
  Lake = 7,
  Town = 8,
  Glade = 9,
  Snow = 10
}

export enum FeatureTile {
  None = 0,
  Tree = 1,
  House = 2,
  Tower = 3,
  VolcanoCore = 4,
  Peak = 5,
  Obelisk = 6,
  FireflyTree = 7
}

export const GROUND_COLORS: Record<GroundTile, string> = {
  [GroundTile.Meadow]: '#5fbc6d',
  [GroundTile.Beach]: '#f2d082',
  [GroundTile.Sea]: '#2676d1',
  [GroundTile.Mountain]: '#8d6e63',
  [GroundTile.Volcano]: '#d84315',
  [GroundTile.Forest]: '#3f8c46',
  [GroundTile.Lake]: '#70c4e8',
  [GroundTile.Town]: '#bfa177',
  [GroundTile.Glade]: '#6a4c93',
  [GroundTile.Snow]: '#cfd8dc'
};

export const FEATURE_COLORS: Record<FeatureTile, string> = {
  [FeatureTile.None]: 'transparent',
  [FeatureTile.Tree]: '#2e7d32',
  [FeatureTile.House]: '#ffab40',
  [FeatureTile.Tower]: '#607d8b',
  [FeatureTile.VolcanoCore]: '#ff7043',
  [FeatureTile.Peak]: '#eceff1',
  [FeatureTile.Obelisk]: '#00acc1',
  [FeatureTile.FireflyTree]: '#c0ca33'
};

export interface WorldLayers {
  width: number;
  height: number;
  ground: number[];
  features: number[];
  collision: number[];
}

const createTilemapData = (): { data: TilemapData; layers: WorldLayers } => {
  const width = 64;
  const height = 48;
  const ground = new Array(width * height).fill(GroundTile.Meadow);
  const features = new Array(width * height).fill(FeatureTile.None);
  const collision = new Array(width * height).fill(0);

  const index = (x: number, y: number): number => y * width + x;
  const inBounds = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;

  const setGround = (x: number, y: number, tile: GroundTile): void => {
    if (inBounds(x, y)) {
      ground[index(x, y)] = tile;
    }
  };

  const addFeature = (x: number, y: number, tile: FeatureTile, block = false): void => {
    if (inBounds(x, y)) {
      features[index(x, y)] = tile;
      if (block) {
        collision[index(x, y)] = 1;
      }
    }
  };

  const blockTile = (x: number, y: number): void => {
    if (inBounds(x, y)) {
      collision[index(x, y)] = 1;
    }
  };

  const paintCircle = (
    cx: number,
    cy: number,
    radius: number,
    painter: (x: number, y: number, distance: number) => void
  ): void => {
    const r2 = radius * radius;
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(height - 1, Math.ceil(cy + radius)); y += 1) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(width - 1, Math.ceil(cx + radius)); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2) {
          painter(x, y, Math.sqrt(d2));
        }
      }
    }
  };

  const carvePath = (points: Array<{ x: number; y: number }>, widthTiles: number): void => {
    const half = Math.floor(widthTiles / 2);
    points.reduce((prev, current) => {
      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let step = 0; step <= steps; step += 1) {
        const t = steps === 0 ? 0 : step / steps;
        const x = Math.round(prev.x + dx * t);
        const y = Math.round(prev.y + dy * t);
        for (let ox = -half; ox <= half; ox += 1) {
          for (let oy = -half; oy <= half; oy += 1) {
            if (inBounds(x + ox, y + oy)) {
              setGround(x + ox, y + oy, GroundTile.Town);
              collision[index(x + ox, y + oy)] = 0;
              features[index(x + ox, y + oy)] = FeatureTile.None;
            }
          }
        }
      }
      return current;
    });
  };

  // Shores and sea
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) {
        setGround(x, y, GroundTile.Sea);
        blockTile(x, y);
      } else if (x < 5 || y < 5 || x >= width - 5 || y >= height - 5) {
        setGround(x, y, GroundTile.Beach);
      }
    }
  }

  // Mountain range in the northwest
  const mountainCenters = [
    { x: 12, y: 10, radius: 7 },
    { x: 8, y: 16, radius: 5 },
    { x: 18, y: 18, radius: 4 }
  ];
  mountainCenters.forEach(({ x, y, radius }) => {
    paintCircle(x, y, radius, (px, py, distance) => {
      setGround(px, py, distance < radius * 0.4 ? GroundTile.Snow : GroundTile.Mountain);
      if (distance < radius * 0.3) {
        addFeature(px, py, FeatureTile.Peak, true);
      } else if (distance > radius * 0.6 && (px + py) % 4 === 0) {
        addFeature(px, py, FeatureTile.Tree, true);
      } else {
        blockTile(px, py);
      }
    });
  });

  // Volcano in the east
  paintCircle(52, 16, 6, (x, y, distance) => {
    setGround(x, y, GroundTile.Volcano);
    blockTile(x, y);
    if (distance < 2.2) {
      addFeature(x, y, FeatureTile.VolcanoCore, true);
    }
  });
  paintCircle(52, 16, 3.2, (x, y, distance) => {
    setGround(x, y, GroundTile.Volcano);
    if (distance > 2.6) {
      collision[index(x, y)] = 0;
    }
  });

  // Lake district in the south
  const lakes = [
    { x: 30, y: 36, radius: 4 },
    { x: 36, y: 40, radius: 3 },
    { x: 24, y: 40, radius: 2.5 }
  ];
  lakes.forEach(({ x, y, radius }) => {
    paintCircle(x, y, radius, (px, py, distance) => {
      setGround(px, py, GroundTile.Lake);
      blockTile(px, py);
      if (distance < radius * 0.45) {
        addFeature(px, py, FeatureTile.FireflyTree, false);
      }
    });
  });

  paintCircle(34, 32, 5, (x, y) => {
    if (ground[index(x, y)] === GroundTile.Meadow) {
      setGround(x, y, GroundTile.Glade);
    }
  });

  // Dense forest to the southeast
  for (let y = 30; y < 46; y += 1) {
    for (let x = 42; x < 60; x += 1) {
      setGround(x, y, GroundTile.Forest);
      if ((x + y) % 3 === 0) {
        addFeature(x, y, FeatureTile.Tree, true);
      }
    }
  }

  // Clear forest paths
  carvePath(
    [
      { x: 44, y: 34 },
      { x: 48, y: 34 },
      { x: 52, y: 36 },
      { x: 52, y: 40 }
    ],
    3
  );

  // Meadow glade centerpiece
  addFeature(34, 30, FeatureTile.Obelisk, true);

  // Harbor town in the southwest
  for (let y = 30; y < 38; y += 1) {
    for (let x = 8; x < 20; x += 1) {
      setGround(x, y, GroundTile.Town);
    }
  }
  [
    { x: 10, y: 32 },
    { x: 13, y: 34 },
    { x: 16, y: 31 }
  ].forEach(({ x, y }) => addFeature(x, y, FeatureTile.House, true));

  // Observatory town near the mountains
  for (let y = 12; y < 20; y += 1) {
    for (let x = 24; x < 34; x += 1) {
      setGround(x, y, GroundTile.Town);
    }
  }
  addFeature(28, 14, FeatureTile.Tower, true);
  addFeature(31, 16, FeatureTile.House, true);

  // Paths connecting major landmarks
  carvePath(
    [
      { x: 14, y: 34 },
      { x: 22, y: 34 },
      { x: 30, y: 32 },
      { x: 36, y: 28 },
      { x: 44, y: 22 },
      { x: 52, y: 20 }
    ],
    3
  );

  carvePath(
    [
      { x: 28, y: 16 },
      { x: 30, y: 22 },
      { x: 32, y: 28 },
      { x: 32, y: 36 }
    ],
    2
  );

  // Scenic bridges across lakes
  carvePath(
    [
      { x: 28, y: 36 },
      { x: 32, y: 36 },
      { x: 36, y: 38 }
    ],
    2
  );

  // Sprinkle decorative firefly trees around the glade
  [
    { x: 30, y: 28 },
    { x: 38, y: 28 },
    { x: 28, y: 34 },
    { x: 40, y: 34 }
  ].forEach(({ x, y }) => addFeature(x, y, FeatureTile.FireflyTree, true));

  // Ensure town areas are walkable
  for (let y = 10; y < 40; y += 1) {
    for (let x = 6; x < 60; x += 1) {
      const idx = index(x, y);
      if (ground[idx] === GroundTile.Town || ground[idx] === GroundTile.Glade) {
        collision[idx] = 0;
      }
    }
  }

  const data: TilemapData = {
    tileSize: TILE_SIZE,
    width,
    height,
    atlasKey: 'tiles',
    layers: [
      { name: 'ground', data: ground },
      { name: 'features', data: features },
      { name: 'collision', data: collision }
    ]
  };

  return { data, layers: { width, height, ground, features, collision } };
};

const buildNavMesh = (tilemap: Tilemap): NavMesh => {
  const nodes: NavMesh['nodes'] = {};
  for (let ty = 0; ty < tilemap.height; ty += 1) {
    for (let tx = 0; tx < tilemap.width; tx += 1) {
      if (tilemap.tileAt('collision', tx, ty) === 1) {
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
        if (tilemap.tileAt('collision', nx, ny) === 1) {
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

export const createWorld = (): {
  tilemap: Tilemap;
  navMesh: NavMesh;
  layers: WorldLayers;
} => {
  const { data, layers } = createTilemapData();
  const tilemap = new Tilemap(data);
  tilemap.setCollisionTiles([1]);
  const navMesh = buildNavMesh(tilemap);
  return { tilemap, navMesh, layers };
};
