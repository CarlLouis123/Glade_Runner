export interface Vec2 {
  x: number;
  y: number;
}

export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });

export const vec2Add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const vec2Sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const vec2Scale = (v: Vec2, scalar: number): Vec2 => ({ x: v.x * scalar, y: v.y * scalar });

export const vec2Length = (v: Vec2): number => Math.hypot(v.x, v.y);

export const vec2Normalize = (v: Vec2): Vec2 => {
  const length = vec2Length(v);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / length, y: v.y / length };
};

export const vec2Lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t)
});
