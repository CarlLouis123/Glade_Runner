import type { Renderer } from './renderer';
import { resources } from './resources';
import type { Vec2 } from './math';

export interface TileLayerData {
  name: string;
  data: number[];
}

export interface TilemapData {
  tileSize: number;
  width: number;
  height: number;
  layers: TileLayerData[];
  atlasKey: string;
}

interface TileLayer {
  name: string;
  tiles: number[];
}

export class Tilemap {
  readonly tileSize: number;
  readonly width: number;
  readonly height: number;
  private readonly layers: Map<string, TileLayer> = new Map();
  private collisionTiles: Set<number> = new Set();

  constructor(data: TilemapData) {
    this.tileSize = data.tileSize;
    this.width = data.width;
    this.height = data.height;
    data.layers.forEach((layer) => {
      this.layers.set(layer.name, { name: layer.name, tiles: layer.data });
    });
  }

  setCollisionTiles(blocked: Iterable<number>): void {
    this.collisionTiles = new Set(blocked);
  }

  isBlocked(tileIndex: number): boolean {
    return this.collisionTiles.has(tileIndex);
  }

  tileAt(layerName: string, tx: number, ty: number): number | undefined {
    const layer = this.layers.get(layerName);
    if (!layer) {
      return undefined;
    }
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
      return undefined;
    }
    return layer.tiles[ty * this.width + tx];
  }

  worldToTile(position: Vec2): Vec2 {
    return {
      x: Math.floor(position.x / this.tileSize),
      y: Math.floor(position.y / this.tileSize)
    };
  }

  render(renderer: Renderer, layerName: string): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      return;
    }
    const { tileSize } = this;
    const cols = this.width;
    const rows = this.height;
    const { width, height } = renderer.getViewport();
    const start = renderer.screenToWorld({ x: 0, y: 0 });
    const end = renderer.screenToWorld({ x: width, y: height });
    const startX = Math.max(0, Math.floor(start.x / tileSize) - 1);
    const startY = Math.max(0, Math.floor(start.y / tileSize) - 1);
    const endX = Math.min(cols, Math.ceil(end.x / tileSize) + 1);
    const endY = Math.min(rows, Math.ceil(end.y / tileSize) + 1);

    for (let ty = startY; ty < endY; ty += 1) {
      for (let tx = startX; tx < endX; tx += 1) {
        const tileId = layer.tiles[ty * cols + tx];
        if (tileId <= 0) {
          continue;
        }
        const textureKey = `${layerName}:${tileId}`;
        const texture = resources.getTexture(textureKey);
        if (!texture) {
          resources.registerTexture(textureKey, null, {
            x: 0,
            y: 0,
            w: tileSize,
            h: tileSize
          });
        }
        const worldX = tx * tileSize + tileSize / 2;
        const worldY = ty * tileSize + tileSize / 2;
        renderer.drawSprite(textureKey, worldX, worldY, tileSize, tileSize);
      }
    }
  }
}
