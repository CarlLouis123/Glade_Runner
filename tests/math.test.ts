import { describe, expect, it } from 'vitest';
import { clamp, lerp, vec2, vec2Add, vec2Normalize } from '@engine/math';

describe('math utils', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lerps between values', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('adds vectors', () => {
    expect(vec2Add(vec2(1, 2), vec2(3, 4))).toEqual({ x: 4, y: 6 });
  });

  it('normalizes vectors', () => {
    const normalized = vec2Normalize(vec2(3, 4));
    expect(normalized.x).toBeCloseTo(0.6, 4);
    expect(normalized.y).toBeCloseTo(0.8, 4);
  });
});
