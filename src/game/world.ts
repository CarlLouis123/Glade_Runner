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
  const width = 200;
  const height = 160;
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

  const tileNoise = (x: number, y: number): number => {
    const value = Math.sin(x * 12.9898 + y * 78.233 + x * y * 0.001) * 43758.5453;
    return value - Math.floor(value);
  };

  const paintRectangle = (
    x0: number,
    y0: number,
    wRect: number,
    hRect: number,
    painter: (x: number, y: number) => void
  ): void => {
    const xStart = Math.max(0, Math.floor(x0));
    const yStart = Math.max(0, Math.floor(y0));
    const xEnd = Math.min(width, Math.ceil(x0 + wRect));
    const yEnd = Math.min(height, Math.ceil(y0 + hRect));
    for (let ty = yStart; ty < yEnd; ty += 1) {
      for (let tx = xStart; tx < xEnd; tx += 1) {
        painter(tx, ty);
      }
    }
  };

  const scatterTrees = (
    region: { minX: number; maxX: number; minY: number; maxY: number },
    density: number,
    feature: FeatureTile,
    block = false
  ): void => {
    for (let ty = region.minY; ty < region.maxY; ty += 1) {
      for (let tx = region.minX; tx < region.maxX; tx += 1) {
        if (!inBounds(tx, ty)) {
          continue;
        }
        if (tileNoise(tx, ty) < density) {
          addFeature(tx, ty, feature, block);
        }
      }
    }
  };

  const placeTown = (
    originX: number,
    originY: number,
    sizeX: number,
    sizeY: number,
    houseTiles: Array<{ x: number; y: number }>,
    extras: Array<{ x: number; y: number; feature: FeatureTile; block?: boolean }> = []
  ): void => {
    paintRectangle(originX, originY, sizeX, sizeY, (x, y) => {
      setGround(x, y, GroundTile.Town);
      collision[index(x, y)] = 0;
    });
    houseTiles.forEach(({ x, y }) => addFeature(x, y, FeatureTile.House, true));
    extras.forEach(({ x, y, feature, block }) => addFeature(x, y, feature, block ?? true));
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

  const carvePath = (
    points: Array<{ x: number; y: number }>,
    widthTiles: number,
    tile: GroundTile = GroundTile.Town,
    options: { feature?: FeatureTile; block?: boolean } = {}
  ): void => {
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
              setGround(x + ox, y + oy, tile);
              if (options.feature) {
                addFeature(x + ox, y + oy, options.feature, options.block ?? false);
              } else {
                features[index(x + ox, y + oy)] = FeatureTile.None;
              }
              if (options.block ?? false) {
                collision[index(x + ox, y + oy)] = 1;
              } else {
                collision[index(x + ox, y + oy)] = 0;
              }
            }
          }
        }
      }
      return current;
    });
  };

  // Sculpt sweeping coastlines and inland seas
  for (let y = 0; y < height; y += 1) {
    const westCoast = 16 + Math.sin((y / height) * Math.PI * 1.2) * 6;
    const eastCoast = width - (16 + Math.cos((y / height) * Math.PI * 1.1) * 7);
    for (let x = 0; x < width; x += 1) {
      const idx = index(x, y);
      if (y < 2 || y >= height - 2 || x < 1 || x >= width - 1) {
        setGround(x, y, GroundTile.Sea);
        blockTile(x, y);
        continue;
      }
      if (x < westCoast - 2 || x > eastCoast + 2) {
        setGround(x, y, GroundTile.Sea);
        blockTile(x, y);
        continue;
      }
      if (ground[idx] === GroundTile.Sea) {
        continue;
      }
      if (y < 6 || y > height - 6 || x < westCoast + 1 || x > eastCoast - 1) {
        setGround(x, y, GroundTile.Beach);
      }
    }
  }

  // Southern bays and sheltered harbors
  paintCircle(34, height - 28, 20, (x, y) => {
    setGround(x, y, GroundTile.Sea);
    blockTile(x, y);
  });
  paintCircle(34, height - 28, 26, (x, y) => {
    if (ground[index(x, y)] !== GroundTile.Sea) {
      setGround(x, y, GroundTile.Beach);
    }
  });
  paintCircle(width - 32, height - 18, 16, (x, y) => {
    setGround(x, y, GroundTile.Sea);
    blockTile(x, y);
  });
  paintCircle(width - 32, height - 18, 22, (x, y) => {
    if (ground[index(x, y)] !== GroundTile.Sea) {
      setGround(x, y, GroundTile.Beach);
    }
  });

  // Rolling mountain spine across the north
  const mountainRidges = [
    { x: 72, y: 22, radius: 16 },
    { x: 94, y: 18, radius: 14 },
    { x: 120, y: 20, radius: 12 },
    { x: 144, y: 24, radius: 11 }
  ];
  mountainRidges.forEach(({ x, y, radius }) => {
    paintCircle(x, y, radius, (px, py, distance) => {
      if (distance < radius * 0.7) {
        setGround(px, py, GroundTile.Mountain);
      }
      if (distance < radius * 0.4) {
        setGround(px, py, GroundTile.Snow);
        addFeature(px, py, FeatureTile.Peak, true);
      } else if (distance < radius * 0.55 && tileNoise(px, py) > 0.7) {
        addFeature(px, py, FeatureTile.Peak, true);
      }
    });
  });

  // High tundra to the northeast
  paintRectangle(width - 40, 6, 30, 32, (x, y) => {
    setGround(x, y, GroundTile.Snow);
  });
  scatterTrees({ minX: width - 36, maxX: width - 6, minY: 10, maxY: 36 }, 0.15, FeatureTile.Tree, true);

  // Smoldering volcanic fields in the southeast
  paintCircle(width - 52, height - 48, 16, (x, y, distance) => {
    setGround(x, y, GroundTile.Volcano);
    if (distance < 5) {
      addFeature(x, y, FeatureTile.VolcanoCore, true);
    } else if (distance < 9 && tileNoise(x, y) > 0.75) {
      addFeature(x, y, FeatureTile.Peak, true);
    }
  });

  // Jewel-toned glade at the heart of the world
  paintCircle(108, 84, 14, (x, y, distance) => {
    setGround(x, y, GroundTile.Glade);
    collision[index(x, y)] = 0;
    if (distance < 3) {
      addFeature(x, y, FeatureTile.Obelisk, true);
    } else if (distance < 11 && tileNoise(x, y) > 0.6) {
      addFeature(x, y, FeatureTile.FireflyTree, false);
    }
  });

  // Tranquil lakes peppered across the countryside
  paintCircle(84, 92, 9, (x, y) => setGround(x, y, GroundTile.Lake));
  paintCircle(120, 110, 7, (x, y) => setGround(x, y, GroundTile.Lake));
  paintCircle(156, 128, 6, (x, y) => setGround(x, y, GroundTile.Lake));

  // Verdant forests that sway with the wind
  paintRectangle(58, 58, 72, 52, (x, y) => {
    if (ground[index(x, y)] !== GroundTile.Glade) {
      setGround(x, y, GroundTile.Forest);
    }
  });
  scatterTrees({ minX: 58, maxX: 130, minY: 58, maxY: 110 }, 0.28, FeatureTile.Tree, true);
  scatterTrees({ minX: 42, maxX: 80, minY: 116, maxY: 150 }, 0.22, FeatureTile.Tree, true);

  // Winding rivers carving through the landscape
  const auroraRiver = [
    { x: 90, y: 18 },
    { x: 84, y: 44 },
    { x: 72, y: 70 },
    { x: 60, y: 100 },
    { x: 48, y: 128 },
    { x: 38, y: height - 26 }
  ];
  carvePath(auroraRiver, 5, GroundTile.Lake);

  const silverRun = [
    { x: 132, y: 30 },
    { x: 128, y: 56 },
    { x: 132, y: 82 },
    { x: 150, y: 108 },
    { x: width - 34, y: height - 22 }
  ];
  carvePath(silverRun, 4, GroundTile.Lake);

  // Bridges spanning the rivers
  carvePath(
    [
      { x: 62, y: 106 },
      { x: 70, y: 106 }
    ],
    3,
    GroundTile.Town
  );
  carvePath(
    [
      { x: 124, y: 86 },
      { x: 136, y: 86 }
    ],
    3,
    GroundTile.Town
  );
  carvePath(
    [
      { x: 156, y: 126 },
      { x: 162, y: 126 }
    ],
    3,
    GroundTile.Town
  );

  // Four thriving towns with distinct characters
  placeTown(
    44,
    height - 58,
    24,
    20,
    [
      { x: 48, y: height - 54 },
      { x: 52, y: height - 48 },
      { x: 58, y: height - 52 },
      { x: 62, y: height - 46 }
    ],
    [{ x: 64, y: height - 50, feature: FeatureTile.Tower }]
  );
  placeTown(
    92,
    62,
    22,
    16,
    [
      { x: 96, y: 66 },
      { x: 102, y: 70 },
      { x: 106, y: 74 }
    ],
    [{ x: 104, y: 68, feature: FeatureTile.House }]
  );
  placeTown(
    132,
    32,
    20,
    14,
    [
      { x: 134, y: 36 },
      { x: 140, y: 38 }
    ],
    [{ x: 142, y: 34, feature: FeatureTile.Tower }]
  );
  placeTown(
    160,
    100,
    18,
    18,
    [
      { x: 164, y: 108 },
      { x: 170, y: 112 },
      { x: 168, y: 104 }
    ],
    [{ x: 174, y: 108, feature: FeatureTile.House }]
  );

  // Illuminated paths connecting every settlement
  carvePath(
    [
      { x: 56, y: height - 50 },
      { x: 74, y: 112 },
      { x: 92, y: 96 },
      { x: 108, y: 84 },
      { x: 134, y: 68 },
      { x: 150, y: 58 }
    ],
    4,
    GroundTile.Town
  );
  carvePath(
    [
      { x: 108, y: 84 },
      { x: 116, y: 98 },
      { x: 138, y: 118 },
      { x: 160, y: 120 }
    ],
    3,
    GroundTile.Town
  );
  carvePath(
    [
      { x: 108, y: 84 },
      { x: 98, y: 120 },
      { x: 112, y: 140 }
    ],
    3,
    GroundTile.Town
  );
  carvePath(
    [
      { x: 150, y: 58 },
      { x: width - 46, y: 46 },
      { x: width - 30, y: 62 }
    ],
    3,
    GroundTile.Town
  );

  // Scenic observation points and monuments
  addFeature(118, 70, FeatureTile.Tower, true);
  addFeature(86, 120, FeatureTile.Obelisk, true);
  addFeature(width - 44, 60, FeatureTile.Obelisk, true);

  // Promote soft banks around bodies of water
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = index(x, y);
      if (ground[idx] === GroundTile.Lake || ground[idx] === GroundTile.Sea) {
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const nx = x + ox;
            const ny = y + oy;
            const nIdx = index(nx, ny);
            if (ground[nIdx] === GroundTile.Meadow) {
              setGround(nx, ny, GroundTile.Beach);
            }
          }
        }
      }
    }
  }

  // Keep town plazas and the glade traversable
  for (let i = 0; i < ground.length; i += 1) {
    if (ground[i] === GroundTile.Town || ground[i] === GroundTile.Glade) {
      collision[i] = 0;
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
