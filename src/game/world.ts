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
  DirtRoad = 2,
  CobblestoneRoad = 3,
  Farmland = 4,
  VegetablePlot = 5,
  Orchard = 6,
  Pasture = 7,
  ShallowWater = 8,
  DeepWater = 9,
  Boardwalk = 10,
  StoneBridge = 11,
  HighlandGrass = 12,
  Cliff = 13,
  Marsh = 14,
  Ruins = 15,
  Plaza = 16,
  CastleStone = 17,
  Sand = 18,
  Forest = 19,
  MeadowDarker = 20
}

export enum FeatureTile {
  None = 0,
  TreeOak = 1,
  TreePine = 2,
  TreeWillow = 3,
  TreeFruit = 4,
  House = 5,
  Barn = 6,
  Windmill = 7,
  Fence = 8,
  HayBale = 9,
  Cart = 10,
  Shrine = 11,
  Animal = 12,
  Watchfire = 13,
  GuardTower = 14,
  Palisade = 15,
  Gate = 16,
  MarketStall = 17,
  Well = 18,
  Blacksmith = 19,
  Inn = 20,
  Barrel = 21,
  Crate = 22,
  Campfire = 23,
  Tent = 24,
  ShrineStone = 25,
  FishingHut = 26,
  Boat = 27,
  Net = 28,
  Reeds = 29,
  Duck = 30,
  BridgeBanner = 31,
  Gatehouse = 32,
  Banner = 33,
  Monastery = 34,
  BellTower = 35,
  Cairn = 36,
  Grave = 37,
  Lantern = 38,
  DeadTree = 39,
  Firefly = 40,
  RuinedWall = 41,
  CollapsedTower = 42,
  BrokenStatue = 43,
  Fountain = 44,
  NobleHouse = 45,
  CastleTower = 46,
  TrainingDummy = 47,
  TreeBush = 48
}

export const GROUND_COLORS: Record<GroundTile, string> = {
  [GroundTile.Meadow]: '#6da266',
  [GroundTile.DirtRoad]: '#a0774a',
  [GroundTile.CobblestoneRoad]: '#9a8d81',
  [GroundTile.Farmland]: '#8b6b3a',
  [GroundTile.VegetablePlot]: '#70522b',
  [GroundTile.Orchard]: '#6f8a4f',
  [GroundTile.Pasture]: '#7ca26d',
  [GroundTile.ShallowWater]: '#63a7c1',
  [GroundTile.DeepWater]: '#1e5075',
  [GroundTile.Boardwalk]: '#a7784f',
  [GroundTile.StoneBridge]: '#808487',
  [GroundTile.HighlandGrass]: '#87a185',
  [GroundTile.Cliff]: '#6d625c',
  [GroundTile.Marsh]: '#4c5d3f',
  [GroundTile.Ruins]: '#6d6a66',
  [GroundTile.Plaza]: '#b4a48f',
  [GroundTile.CastleStone]: '#a2a6ac',
  [GroundTile.Sand]: '#c7a566',
  [GroundTile.Forest]: '#4c7a45',
  [GroundTile.MeadowDarker]: '#547d4e'
};

export const FEATURE_COLORS: Record<FeatureTile, string> = {
  [FeatureTile.None]: 'transparent',
  [FeatureTile.TreeOak]: '#2e5b2d',
  [FeatureTile.TreePine]: '#1f4b2a',
  [FeatureTile.TreeWillow]: '#335a42',
  [FeatureTile.TreeFruit]: '#4f7b33',
  [FeatureTile.House]: '#c58f63',
  [FeatureTile.Barn]: '#a4513d',
  [FeatureTile.Windmill]: '#8f7c6b',
  [FeatureTile.Fence]: '#b89a7a',
  [FeatureTile.HayBale]: '#d8b24c',
  [FeatureTile.Cart]: '#7c5734',
  [FeatureTile.Shrine]: '#b5b1c8',
  [FeatureTile.Animal]: '#d2b8a2',
  [FeatureTile.Watchfire]: '#ffb347',
  [FeatureTile.GuardTower]: '#7f8d96',
  [FeatureTile.Palisade]: '#8b6238',
  [FeatureTile.Gate]: '#6f5a3d',
  [FeatureTile.MarketStall]: '#d77f5b',
  [FeatureTile.Well]: '#7e9aa8',
  [FeatureTile.Blacksmith]: '#4b4b4b',
  [FeatureTile.Inn]: '#a67c52',
  [FeatureTile.Barrel]: '#7a5635',
  [FeatureTile.Crate]: '#6a4d2e',
  [FeatureTile.Campfire]: '#ff6d3a',
  [FeatureTile.Tent]: '#b78b5d',
  [FeatureTile.ShrineStone]: '#9999af',
  [FeatureTile.FishingHut]: '#7c6c52',
  [FeatureTile.Boat]: '#55606a',
  [FeatureTile.Net]: '#c8d3da',
  [FeatureTile.Reeds]: '#5c7c52',
  [FeatureTile.Duck]: '#c9d2d6',
  [FeatureTile.BridgeBanner]: '#c04f43',
  [FeatureTile.Gatehouse]: '#8d9096',
  [FeatureTile.Banner]: '#9c3d3d',
  [FeatureTile.Monastery]: '#c5c3b5',
  [FeatureTile.BellTower]: '#b3b1a1',
  [FeatureTile.Cairn]: '#817b73',
  [FeatureTile.Grave]: '#7d7e7f',
  [FeatureTile.Lantern]: '#f4d87a',
  [FeatureTile.DeadTree]: '#4b3b2a',
  [FeatureTile.Firefly]: '#dce569',
  [FeatureTile.RuinedWall]: '#686764',
  [FeatureTile.CollapsedTower]: '#707680',
  [FeatureTile.BrokenStatue]: '#9fa3a6',
  [FeatureTile.Fountain]: '#7aa7c4',
  [FeatureTile.NobleHouse]: '#b89e7a',
  [FeatureTile.CastleTower]: '#959ca8',
  [FeatureTile.TrainingDummy]: '#b37d47',
  [FeatureTile.TreeBush]: '#3c6b3b'
};

export interface WorldLayers {
  width: number;
  height: number;
  ground: number[];
  features: number[];
  collision: number[];
}

const createTilemapData = (): { data: TilemapData; layers: WorldLayers } => {
  const width = 240;
  const levelHeight = 40;
  const height = levelHeight * 10;
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

  const scatterFeatures = (
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

  const drawLine = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    widthTiles: number,
    paint: (x: number, y: number) => void
  ): void => {
    const half = Math.floor(widthTiles / 2);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let step = 0; step <= steps; step += 1) {
      const t = steps === 0 ? 0 : step / steps;
      const x = Math.round(from.x + dx * t);
      const y = Math.round(from.y + dy * t);
      for (let ox = -half; ox <= half; ox += 1) {
        for (let oy = -half; oy <= half; oy += 1) {
          if (inBounds(x + ox, y + oy)) {
            paint(x + ox, y + oy);
          }
        }
      }
    }
  };

  const roadX = Math.floor(width / 2);
  const roadHalfWidth = 3;
  const levelBounds = (level: number): { minY: number; maxY: number } => {
    const minY = level * levelHeight;
    const maxY = Math.min(height, minY + levelHeight);
    return { minY, maxY };
  };

  const paintRoad = (startY: number, endY: number, tile: GroundTile): void => {
    for (let y = startY; y < endY; y += 1) {
      for (let x = roadX - roadHalfWidth; x <= roadX + roadHalfWidth; x += 1) {
        if (!inBounds(x, y)) {
          continue;
        }
        setGround(x, y, tile);
        collision[index(x, y)] = 0;
      }
    }
  };

  const placeFenceRect = (
    x0: number,
    y0: number,
    wRect: number,
    hRect: number
  ): void => {
    for (let y = y0; y < y0 + hRect; y += 1) {
      for (let x = x0; x < x0 + wRect; x += 1) {
        const isEdge = x === x0 || x === x0 + wRect - 1 || y === y0 || y === y0 + hRect - 1;
        if (isEdge) {
          addFeature(x, y, FeatureTile.Fence, true);
        }
      }
    }
  };

  // Level 1 – Outer Farmlands
  {
    const { minY, maxY } = levelBounds(0);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Meadow));
    paintRoad(minY, maxY, GroundTile.DirtRoad);

    const farmlandWidth = 64;
    paintRectangle(roadX - roadHalfWidth - farmlandWidth, minY + 4, farmlandWidth - 6, maxY - minY - 8, (x, y) => {
      setGround(x, y, GroundTile.Farmland);
    });
    paintRectangle(roadX + roadHalfWidth + 6, minY + 4, farmlandWidth - 12, maxY - minY - 8, (x, y) => {
      setGround(x, y, GroundTile.VegetablePlot);
    });

    scatterFeatures({
      minX: roadX - roadHalfWidth - farmlandWidth,
      maxX: roadX - roadHalfWidth - 6,
      minY: minY + 6,
      maxY: maxY - 4
    }, 0.14, FeatureTile.HayBale, true);

    scatterFeatures({
      minX: roadX + roadHalfWidth + 8,
      maxX: roadX + roadHalfWidth + farmlandWidth - 10,
      minY: minY + 6,
      maxY: maxY - 6
    }, 0.16, FeatureTile.TreeBush, false);

    const farmX = roadX + roadHalfWidth + 24;
    const farmY = minY + 8;
    paintRectangle(farmX - 6, farmY - 2, 20, 16, (x, y) => setGround(x, y, GroundTile.Meadow));
    addFeature(farmX, farmY, FeatureTile.House, true);
    addFeature(farmX + 4, farmY + 4, FeatureTile.House, true);
    addFeature(farmX + 8, farmY + 1, FeatureTile.Barn, true);
    placeFenceRect(farmX - 4, farmY + 6, 16, 10);
    scatterFeatures({ minX: farmX - 3, maxX: farmX + 11, minY: farmY + 7, maxY: farmY + 14 }, 0.18, FeatureTile.Animal, false);
    addFeature(farmX - 2, farmY + 12, FeatureTile.Gate, false);
    addFeature(farmX + 10, farmY + 12, FeatureTile.Cart, true);
    addFeature(farmX + 6, farmY + 14, FeatureTile.Crate, true);

    const windmillX = roadX - roadHalfWidth - 32;
    const windmillY = minY + Math.floor((maxY - minY) / 2);
    paintRectangle(windmillX - 6, windmillY - 6, 16, 16, (x, y) => setGround(x, y, GroundTile.MeadowDarker));
    addFeature(windmillX, windmillY, FeatureTile.Windmill, true);
    drawLine({ x: windmillX + 8, y: windmillY + 8 }, { x: roadX - roadHalfWidth - 1, y: windmillY + 4 }, 2, (x, y) => {
      setGround(x, y, GroundTile.DirtRoad);
      collision[index(x, y)] = 0;
    });

    addFeature(roadX - 1, minY + 6, FeatureTile.Shrine, true);
    addFeature(roadX + 2, minY + 10, FeatureTile.Barrel, true);
    addFeature(roadX - 3, minY + 18, FeatureTile.Cart, true);
  }

  // Level 2 – Village Outskirts
  {
    const { minY, maxY } = levelBounds(1);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Meadow));
    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);

    paintRectangle(roadX - roadHalfWidth - 70, minY + 4, 62, maxY - minY - 8, (x, y) => {
      setGround(x, y, GroundTile.Orchard);
    });
    scatterFeatures({
      minX: roadX - roadHalfWidth - 70,
      maxX: roadX - roadHalfWidth - 8,
      minY: minY + 6,
      maxY: maxY - 6
    }, 0.22, FeatureTile.TreeFruit, true);
    scatterFeatures({
      minX: roadX - roadHalfWidth - 70,
      maxX: roadX - roadHalfWidth - 8,
      minY: minY + 6,
      maxY: maxY - 6
    }, 0.08, FeatureTile.TreeBush, false);

    paintRectangle(roadX + roadHalfWidth + 8, minY + 4, 70, maxY - minY - 8, (x, y) => {
      setGround(x, y, GroundTile.Pasture);
    });
    scatterFeatures({
      minX: roadX + roadHalfWidth + 10,
      maxX: roadX + roadHalfWidth + 72,
      minY: minY + 6,
      maxY: maxY - 6
    }, 0.16, FeatureTile.Animal, false);

    for (let x = 12; x < width - 12; x += 1) {
      if (Math.abs(x - roadX) <= roadHalfWidth) {
        continue;
      }
      addFeature(x, maxY - 6, FeatureTile.Palisade, true);
    }
    addFeature(roadX, maxY - 6, FeatureTile.Gate, false);
    addFeature(roadX - 4, maxY - 10, FeatureTile.Watchfire, false);
    addFeature(roadX + 4, maxY - 10, FeatureTile.Watchfire, false);
    addFeature(roadX - 8, minY + 10, FeatureTile.GuardTower, true);
    addFeature(roadX + 8, minY + 12, FeatureTile.GuardTower, true);
    addFeature(roadX - 12, minY + 14, FeatureTile.House, true);
    addFeature(roadX + 14, minY + 18, FeatureTile.House, true);
    addFeature(roadX + roadHalfWidth + 20, minY + 8, FeatureTile.Gatehouse, true);

    addFeature(roadX + roadHalfWidth + 26, minY + 12, FeatureTile.Animal, false);
    addFeature(roadX - roadHalfWidth - 30, minY + 10, FeatureTile.TreeOak, true);
  }

  // Level 3 – Inner Village & Market Square
  {
    const { minY, maxY } = levelBounds(2);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Meadow));
    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);

    const squareSize = 15;
    const squareMinX = roadX - Math.floor(squareSize / 2) - 20;
    const squareMinY = minY + Math.floor((maxY - minY) / 2) - Math.floor(squareSize / 2);
    paintRectangle(squareMinX, squareMinY, squareSize + 40, squareSize + 6, (x, y) => {
      setGround(x, y, GroundTile.Plaza);
    });

    for (let sx = squareMinX + 4; sx < squareMinX + squareSize + 34; sx += 4) {
      addFeature(sx, squareMinY + 2, FeatureTile.MarketStall, true);
      addFeature(sx, squareMinY + squareSize + 2, FeatureTile.MarketStall, true);
    }
    addFeature(roadX, squareMinY + Math.floor(squareSize / 2), FeatureTile.Well, true);
    addFeature(roadX - 6, squareMinY + 4, FeatureTile.Barrel, true);
    addFeature(roadX + 6, squareMinY + squareSize, FeatureTile.Crate, true);

    const innX = squareMinX - 10;
    const innY = squareMinY - 4;
    paintRectangle(innX - 2, innY - 2, 12, 12, (x, y) => setGround(x, y, GroundTile.Plaza));
    addFeature(innX, innY, FeatureTile.Inn, true);
    addFeature(innX + 2, innY + 4, FeatureTile.Lantern, false);
    addFeature(innX + 4, innY - 2, FeatureTile.Banner, false);

    const blacksmithX = squareMinX + squareSize + 26;
    const blacksmithY = squareMinY + 2;
    addFeature(blacksmithX, blacksmithY, FeatureTile.Blacksmith, true);
    addFeature(blacksmithX + 2, blacksmithY, FeatureTile.Crate, true);
    addFeature(blacksmithX + 1, blacksmithY + 4, FeatureTile.Barrel, true);

    for (let offset = -18; offset <= 18; offset += 6) {
      addFeature(roadX + offset, minY + 6, FeatureTile.House, true);
      addFeature(roadX + offset, maxY - 8, FeatureTile.House, true);
    }

    drawLine({ x: roadX - 30, y: squareMinY + squareSize + 8 }, { x: roadX - 60, y: maxY - 4 }, 2, (x, y) => {
      setGround(x, y, GroundTile.DirtRoad);
      collision[index(x, y)] = 0;
      addFeature(x, y, FeatureTile.Barrel, false);
    });

    drawLine({ x: roadX + 30, y: squareMinY + 2 }, { x: roadX + 70, y: minY + 10 }, 2, (x, y) => {
      setGround(x, y, GroundTile.DirtRoad);
      collision[index(x, y)] = 0;
    });
    addFeature(roadX + 72, minY + 12, FeatureTile.Boat, true);
    addFeature(roadX + 72, minY + 14, FeatureTile.Net, false);
  }

  // Level 4 – Forest Road
  {
    const { minY, maxY } = levelBounds(3);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Forest));
    paintRoad(minY, maxY, GroundTile.DirtRoad);
    scatterFeatures({ minX: 8, maxX: width - 8, minY, maxY }, 0.28, FeatureTile.TreeOak, true);
    scatterFeatures({ minX: 12, maxX: width - 12, minY, maxY }, 0.18, FeatureTile.TreePine, true);

    const campX = roadX + 40;
    const campY = minY + 12;
    paintRectangle(campX - 6, campY - 4, 18, 16, (x, y) => setGround(x, y, GroundTile.MeadowDarker));
    addFeature(campX, campY, FeatureTile.Tent, true);
    addFeature(campX + 4, campY + 2, FeatureTile.Tent, true);
    addFeature(campX + 2, campY + 6, FeatureTile.Campfire, false);
    addFeature(campX + 8, campY + 6, FeatureTile.Crate, true);

    const shrineX = roadX - 42;
    const shrineY = minY + 20;
    addFeature(shrineX, shrineY, FeatureTile.ShrineStone, true);
    addFeature(shrineX + 2, shrineY, FeatureTile.Lantern, false);

    scatterFeatures({ minX: roadX - 60, maxX: roadX - 10, minY: minY + 8, maxY: maxY - 8 }, 0.16, FeatureTile.TreeBush, false);
  }

  // Level 5 – Lake & River Crossing
  {
    const { minY, maxY } = levelBounds(4);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Meadow));
    const lakeStartX = Math.floor(width * 0.55);
    paintRectangle(lakeStartX, minY, Math.floor(width * 0.45), maxY - minY, (x, y) => {
      setGround(x, y, GroundTile.DeepWater);
      blockTile(x, y);
    });
    for (let y = minY; y < maxY; y += 1) {
      for (let x = lakeStartX; x < width; x += 1) {
        const shoreDistance = x - lakeStartX;
        const verticalEdge = Math.min(y - minY, maxY - y - 1);
        if (shoreDistance <= 2 || verticalEdge <= 2 || tileNoise(x, y) > 0.88) {
          setGround(x, y, GroundTile.ShallowWater);
          blockTile(x, y);
        }
      }
    }

    const riverY = minY + Math.floor((maxY - minY) / 2);
    paintRectangle(roadX - 40, riverY - 3, 120, 6, (x, y) => {
      setGround(x, y, GroundTile.ShallowWater);
      blockTile(x, y);
    });

    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);
    paintRectangle(roadX - roadHalfWidth, riverY - 3, roadHalfWidth * 2 + 1, 6, (x, y) => {
      setGround(x, y, GroundTile.StoneBridge);
      collision[index(x, y)] = 0;
    });
    addFeature(roadX - 2, riverY - 2, FeatureTile.BridgeBanner, false);
    addFeature(roadX + 2, riverY + 2, FeatureTile.BridgeBanner, false);

    const boardwalkY = minY + 6;
    paintRectangle(Math.floor(width * 0.62), boardwalkY, Math.floor(width * 0.3), 6, (x, y) => {
      setGround(x, y, GroundTile.Boardwalk);
      collision[index(x, y)] = 0;
    });
    addFeature(Math.floor(width * 0.62) + 4, boardwalkY + 1, FeatureTile.FishingHut, true);
    addFeature(Math.floor(width * 0.62) + 10, boardwalkY + 1, FeatureTile.FishingHut, true);
    addFeature(Math.floor(width * 0.62) + 16, boardwalkY + 1, FeatureTile.Net, false);
    addFeature(Math.floor(width * 0.62) + 22, boardwalkY + 1, FeatureTile.Boat, true);

    scatterFeatures({ minX: lakeStartX, maxX: width - 6, minY: minY + 8, maxY: maxY - 6 }, 0.18, FeatureTile.Reeds, true);
    scatterFeatures({ minX: lakeStartX - 6, maxX: lakeStartX + 12, minY: minY + 6, maxY: maxY - 6 }, 0.14, FeatureTile.TreeWillow, true);
    scatterFeatures({ minX: lakeStartX + 6, maxX: width - 8, minY: minY + 8, maxY: maxY - 8 }, 0.08, FeatureTile.Duck, false);
  }

  // Level 6 – Bridge Fortress & Narrow Pass
  {
    const { minY, maxY } = levelBounds(5);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Cliff));
    const gorgeTop = minY + 10;
    const gorgeBottom = maxY - 10;
    paintRoad(minY, gorgeTop - 4, GroundTile.StoneBridge);
    paintRectangle(0, gorgeTop, width, gorgeBottom - gorgeTop, (x, y) => {
      setGround(x, y, GroundTile.DeepWater);
      blockTile(x, y);
    });
    for (let y = gorgeTop; y < gorgeBottom; y += 1) {
      const edgeDepth = Math.min(y - gorgeTop, gorgeBottom - y - 1);
      if (edgeDepth <= 1) {
        for (let x = 0; x < width; x += 1) {
          setGround(x, y, GroundTile.ShallowWater);
          blockTile(x, y);
        }
      }
    }
    paintRectangle(0, minY + 6, width, 4, (x, y) => setGround(x, y, GroundTile.Cliff));
    paintRectangle(0, maxY - 10, width, 4, (x, y) => setGround(x, y, GroundTile.Cliff));

    const bridgeWidth = roadHalfWidth * 2 + 4;
    const bridgeStartX = roadX - Math.floor(bridgeWidth / 2);
    paintRectangle(bridgeStartX, gorgeTop - 4, bridgeWidth, gorgeBottom - gorgeTop + 8, (x, y) => {
      setGround(x, y, GroundTile.StoneBridge);
      collision[index(x, y)] = 0;
    });
    paintRoad(gorgeBottom + 4, maxY, GroundTile.StoneBridge);
    addFeature(roadX - 6, minY + 6, FeatureTile.Gatehouse, true);
    addFeature(roadX + 6, minY + 6, FeatureTile.Gatehouse, true);
    addFeature(roadX, minY + 4, FeatureTile.Gate, false);
    addFeature(roadX - 10, minY + 4, FeatureTile.GuardTower, true);
    addFeature(roadX + 10, minY + 4, FeatureTile.GuardTower, true);
    addFeature(roadX - 4, maxY - 6, FeatureTile.CastleTower, true);
    addFeature(roadX + 4, maxY - 6, FeatureTile.CastleTower, true);
    addFeature(roadX, maxY - 8, FeatureTile.BridgeBanner, false);

    addFeature(roadX - 12, minY + 12, FeatureTile.Watchfire, false);
    addFeature(roadX + 12, minY + 12, FeatureTile.Watchfire, false);
    addFeature(roadX - 2, minY + 12, FeatureTile.Lantern, false);
    addFeature(roadX + 2, minY + 12, FeatureTile.Lantern, false);
  }

  // Level 7 – Highlands & Monastery Road
  {
    const { minY, maxY } = levelBounds(6);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.HighlandGrass));
    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);
    scatterFeatures({ minX: 8, maxX: width - 8, minY, maxY }, 0.12, FeatureTile.TreePine, true);

    for (let tier = 0; tier < 3; tier += 1) {
      const plateauY = minY + 8 + tier * 10;
      drawLine({ x: roadX - 60 + tier * 10, y: plateauY }, { x: roadX + 60 - tier * 8, y: plateauY }, 1, (x, y) => {
        setGround(x, y, GroundTile.Cliff);
        blockTile(x, y);
      });
    }

    const monasteryX = roadX + 50;
    const monasteryY = minY + 6;
    paintRectangle(monasteryX - 6, monasteryY, 32, 26, (x, y) => setGround(x, y, GroundTile.CastleStone));
    addFeature(monasteryX, monasteryY + 4, FeatureTile.Monastery, true);
    addFeature(monasteryX + 12, monasteryY + 2, FeatureTile.BellTower, true);
    addFeature(monasteryX + 8, monasteryY + 12, FeatureTile.TreeBush, false);
    addFeature(monasteryX + 4, monasteryY + 16, FeatureTile.Lantern, false);
    addFeature(monasteryX + 10, monasteryY + 16, FeatureTile.Lantern, false);

    scatterFeatures({ minX: roadX - 80, maxX: roadX - 20, minY: minY + 6, maxY: maxY - 4 }, 0.1, FeatureTile.Cairn, true);
    scatterFeatures({ minX: roadX - 60, maxX: roadX - 10, minY: minY + 16, maxY: maxY - 6 }, 0.08, FeatureTile.Grave, true);

    addFeature(roadX + 30, maxY - 10, FeatureTile.Lantern, false);
    addFeature(roadX + 26, maxY - 12, FeatureTile.Cairn, true);
  }

  // Level 8 – Dark Forest & Swamp Edge
  {
    const { minY, maxY } = levelBounds(7);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Marsh));
    paintRoad(minY, maxY, GroundTile.DirtRoad);
    scatterFeatures({ minX: 4, maxX: width - 4, minY, maxY }, 0.26, FeatureTile.TreePine, true);
    scatterFeatures({ minX: 4, maxX: width - 4, minY, maxY }, 0.22, FeatureTile.DeadTree, true);

    for (let segment = 0; segment < 4; segment += 1) {
      const segY = minY + 6 + segment * 6;
      paintRectangle(roadX - 2, segY, 4, 2, (x, y) => {
        setGround(x, y, GroundTile.Boardwalk);
        collision[index(x, y)] = 0;
      });
    }

    for (let pool = 0; pool < 5; pool += 1) {
      const cx = roadX + (pool % 2 === 0 ? 36 : -42) + pool * 4;
      const cy = minY + 8 + pool * 5;
      paintCircle(cx, cy, 5, (x, y, distance) => {
        setGround(x, y, distance < 2 ? GroundTile.DeepWater : GroundTile.ShallowWater);
        blockTile(x, y);
      });
    }

    scatterFeatures({ minX: roadX - 50, maxX: roadX + 50, minY: minY + 4, maxY: maxY - 4 }, 0.12, FeatureTile.Firefly, false);
    addFeature(roadX + 60, minY + 6, FeatureTile.House, true);
    addFeature(roadX + 60, minY + 8, FeatureTile.Shrine, true);
  }

  // Level 9 – Ruined Outskirts & Crumbling Walls
  {
    const { minY, maxY } = levelBounds(8);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.Ruins));
    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);

    drawLine({ x: roadX - 70, y: minY + 6 }, { x: roadX + 70, y: minY + 6 }, 2, (x, y) => {
      addFeature(x, y, FeatureTile.RuinedWall, true);
    });
    drawLine({ x: roadX - 60, y: minY + 10 }, { x: roadX - 60, y: maxY - 4 }, 2, (x, y) => {
      addFeature(x, y, FeatureTile.RuinedWall, true);
    });
    drawLine({ x: roadX + 64, y: minY + 10 }, { x: roadX + 64, y: maxY - 4 }, 2, (x, y) => {
      addFeature(x, y, FeatureTile.RuinedWall, true);
    });

    addFeature(roadX - 20, minY + 12, FeatureTile.CollapsedTower, true);
    addFeature(roadX + 24, minY + 14, FeatureTile.CollapsedTower, true);
    addFeature(roadX, minY + 20, FeatureTile.BrokenStatue, true);

    const fountainY = minY + Math.floor((maxY - minY) / 2);
    addFeature(roadX, fountainY, FeatureTile.Fountain, true);

    scatterFeatures({ minX: roadX - 70, maxX: roadX + 70, minY: minY + 12, maxY: maxY - 6 }, 0.14, FeatureTile.TreeOak, true);
    scatterFeatures({ minX: roadX - 50, maxX: roadX + 50, minY: minY + 12, maxY: maxY - 6 }, 0.1, FeatureTile.TreeBush, false);
    addFeature(roadX + 70, maxY - 6, FeatureTile.Cart, true);
  }

  // Level 10 – Inner Citadel & Capital
  {
    const { minY, maxY } = levelBounds(9);
    paintRectangle(0, minY, width, maxY - minY, (x, y) => setGround(x, y, GroundTile.CastleStone));
    paintRoad(minY, maxY, GroundTile.CobblestoneRoad);

    const outerRingY = minY + 6;
    paintRectangle(roadX - 70, outerRingY, 140, 12, (x, y) => setGround(x, y, GroundTile.CastleStone));
    for (let offset = -60; offset <= 60; offset += 12) {
      addFeature(roadX + offset, outerRingY + 2, FeatureTile.House, true);
      addFeature(roadX + offset, outerRingY + 8, FeatureTile.House, true);
    }

    const nobleRingY = outerRingY + 16;
    paintRectangle(roadX - 52, nobleRingY, 104, 12, (x, y) => setGround(x, y, GroundTile.Plaza));
    for (let offset = -40; offset <= 40; offset += 16) {
      addFeature(roadX + offset, nobleRingY + 2, FeatureTile.NobleHouse, true);
      addFeature(roadX + offset + 4, nobleRingY + 6, FeatureTile.TreeBush, false);
    }

    const citadelX = roadX - 20;
    const citadelY = nobleRingY + 14;
    paintRectangle(citadelX, citadelY, 40, 18, (x, y) => setGround(x, y, GroundTile.CastleStone));
    addFeature(citadelX + 4, citadelY + 4, FeatureTile.CastleTower, true);
    addFeature(citadelX + 28, citadelY + 4, FeatureTile.CastleTower, true);
    addFeature(citadelX + 14, citadelY + 2, FeatureTile.CastleTower, true);
    addFeature(citadelX + 14, citadelY + 12, FeatureTile.TrainingDummy, true);
    addFeature(citadelX + 10, citadelY + 8, FeatureTile.Fountain, true);
    addFeature(citadelX + 18, citadelY + 8, FeatureTile.Lantern, false);
    addFeature(citadelX + 22, citadelY + 8, FeatureTile.Lantern, false);

    addFeature(roadX, minY + 4, FeatureTile.Gate, false);
    addFeature(roadX - 6, minY + 4, FeatureTile.GuardTower, true);
    addFeature(roadX + 6, minY + 4, FeatureTile.GuardTower, true);
    addFeature(roadX - 4, minY + 10, FeatureTile.Banner, false);
    addFeature(roadX + 4, minY + 10, FeatureTile.Banner, false);
  }

  const blockingGroundTiles = new Set<GroundTile>([
    GroundTile.DeepWater,
    GroundTile.ShallowWater,
    GroundTile.Cliff,
    GroundTile.Marsh
  ]);

  for (let i = 0; i < ground.length; i += 1) {
    if (blockingGroundTiles.has(ground[i] as GroundTile)) {
      collision[i] = 1;
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
