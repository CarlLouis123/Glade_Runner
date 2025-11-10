import { describe, expect, it } from 'vitest';
import { Tilemap } from '@engine/tilemap';

const sample = new Tilemap({
  tileSize: 32,
  width: 4,
  height: 4,
  atlasKey: 'tiles',
  layers: [
    { name: 'ground', data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { name: 'collision', data: [0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ]
});

sample.setCollisionTiles([2]);

describe('tilemap', () => {
  it('reads tiles by coordinate', () => {
    expect(sample.tileAt('collision', 2, 0)).toBe(2);
    expect(sample.tileAt('collision', 0, 0)).toBe(0);
  });

  it('converts world to tile coordinates', () => {
    expect(sample.worldToTile({ x: 64, y: 32 })).toEqual({ x: 2, y: 1 });
  });
});
