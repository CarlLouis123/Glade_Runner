import { resources } from './resources';
import type { Vec2 } from './math';
import { clamp, vec2Lerp } from './math';

export interface Camera {
  position: Vec2;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  readonly camera: Camera = {
    position: { x: 0, y: 0 },
    viewportWidth: 0,
    viewportHeight: 0,
    zoom: 1
  };
  private showGrid = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setViewport(width: number, height: number): void {
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }

  getViewport(): { width: number; height: number } {
    return { width: this.camera.viewportWidth, height: this.camera.viewportHeight };
  }

  setCameraPosition(target: Vec2, lerpAmount: number): void {
    this.camera.position = vec2Lerp(this.camera.position, target, clamp(lerpAmount, 0, 1));
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  toggleDebugGrid(): void {
    this.showGrid = !this.showGrid;
  }

  clear(color = '#0b1020'): void {
    const { viewportWidth, viewportHeight } = this.camera;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    this.ctx.restore();
  }

  worldToScreen(position: Vec2): Vec2 {
    const { position: cameraPos, zoom } = this.camera;
    return {
      x: (position.x - cameraPos.x) * zoom + this.camera.viewportWidth / 2,
      y: (position.y - cameraPos.y) * zoom + this.camera.viewportHeight / 2
    };
  }

  screenToWorld(position: Vec2): Vec2 {
    const { position: cameraPos, zoom } = this.camera;
    return {
      x: (position.x - this.camera.viewportWidth / 2) / zoom + cameraPos.x,
      y: (position.y - this.camera.viewportHeight / 2) / zoom + cameraPos.y
    };
  }

  drawSprite(textureKey: string, x: number, y: number, w: number, h: number): void {
    const texture = resources.getTexture(textureKey);
    const screenPosition = this.worldToScreen({ x, y });
    const width = w * this.camera.zoom;
    const height = h * this.camera.zoom;

    if (!this.isInViewport(screenPosition.x, screenPosition.y, width, height)) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(screenPosition.x, screenPosition.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    if (texture?.image) {
      const { image, frame } = texture;
      this.ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
    } else {
      this.ctx.fillStyle = this.colorForKey(textureKey);
      this.ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, color = '#e6e6e6', size = 16): void {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px var(--font-family, 'Segoe UI', sans-serif)`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  flushDebug(): void {
    if (!this.showGrid) {
      return;
    }
    const spacing = 32 * this.camera.zoom;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.camera.viewportWidth; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.camera.viewportHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.camera.viewportHeight; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.camera.viewportWidth, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private isInViewport(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w >= 0 &&
      y + h >= 0 &&
      x - w <= this.camera.viewportWidth &&
      y - h <= this.camera.viewportHeight
    );
  }

  private colorForKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const r = (hash & 0xff0000) >> 16;
    const g = (hash & 0x00ff00) >> 8;
    const b = hash & 0x0000ff;
    return `rgba(${(r + 256) % 256}, ${(g + 256) % 256}, ${(b + 256) % 256}, 0.8)`;
  }
}
