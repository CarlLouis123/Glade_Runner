import { resources } from './resources';
import type { Vec2 } from './math';
import { clamp, vec2Lerp } from './math';

type ProceduralDrawer = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const COLOR_PALETTE: Record<string, string> = {
  'ground:1': '#5fbc6d', // meadow
  'ground:2': '#f2d082', // sandy beach
  'ground:3': '#2676d1', // deep sea
  'ground:4': '#8d6e63', // mountains
  'ground:5': '#d84315', // volcanic crust
  'ground:6': '#3f8c46', // dense forest floor
  'ground:7': '#70c4e8', // lakes
  'ground:8': '#bfa177', // cobblestone town
  'ground:9': '#6a4c93', // enchanted glade
  'ground:10': '#cfd8dc', // snowy peaks
  'features:1': '#2e7d32',
  'features:2': '#ffab40',
  'features:3': '#6d4c41',
  'features:4': '#ff7043',
  'features:5': '#607d8b',
  'features:6': '#0097a7',
  'features:7': '#c0ca33',
  player: '#f5f5f5',
  'npc:traveler': '#ff8f00',
  'npc:scholar': '#4fc3f7',
  'npc:ranger': '#81c784',
  'npc:oracle': '#ce93d8'
};

const createTreeDrawer = (leafColor: string): ProceduralDrawer => (ctx, w, h) => {
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-w * 0.1, h * 0.05, w * 0.2, h * 0.4);
  ctx.beginPath();
  ctx.fillStyle = leafColor;
  ctx.arc(-w * 0.15, -h * 0.05, w * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.15, -h * 0.05, w * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -h * 0.25, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
};

const PROCEDURAL_DRAWERS: Record<string, ProceduralDrawer> = {
  'features:1': createTreeDrawer('#2e7d32'),
  'features:2': (ctx, w, h) => {
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-w * 0.25, -h * 0.05, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.05);
    ctx.lineTo(0, -h * 0.45);
    ctx.lineTo(w * 0.3, -h * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#ffcc80';
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-w * 0.06, h * 0.15, w * 0.12, h * 0.2);
  },
  'features:3': (ctx, w, h) => {
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-w * 0.2, -h * 0.35, w * 0.4, h * 0.8);
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(-w * 0.05, -h * 0.3, w * 0.1, h * 0.18);
    ctx.fillRect(-w * 0.05, -h * 0.05, w * 0.1, h * 0.18);
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(0, -h * 0.4, w * 0.22, 0, Math.PI, true);
    ctx.fill();
  },
  'features:4': (ctx, w, h) => {
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-w * 0.12, h * 0.05, w * 0.24, h * 0.35);
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, h * 0.05);
    ctx.lineTo(0, -h * 0.45);
    ctx.lineTo(w * 0.3, h * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#d84315';
    ctx.fill();
    ctx.fillStyle = '#ffab91';
    ctx.beginPath();
    ctx.arc(0, -h * 0.2, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
  },
  'features:5': (ctx, w, h) => {
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, h * 0.35);
    ctx.lineTo(0, -h * 0.45);
    ctx.lineTo(w * 0.4, h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.05);
    ctx.lineTo(0, -h * 0.3);
    ctx.lineTo(w * 0.2, h * 0.05);
    ctx.closePath();
    ctx.fill();
  },
  'features:6': (ctx, w, h) => {
    ctx.fillStyle = '#006064';
    ctx.fillRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.5);
    ctx.fillStyle = '#4dd0e1';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00acc1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.35);
    ctx.lineTo(0, h * 0.35);
    ctx.moveTo(-w * 0.35, 0);
    ctx.lineTo(w * 0.35, 0);
    ctx.stroke();
  },
  'features:7': createTreeDrawer('#aeea00'),
  'npc:traveler': (ctx, w, h) => {
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.arc(0, -h * 0.25, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(-w * 0.16, -h * 0.05, w * 0.32, h * 0.35);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-w * 0.22, h * 0.3, w * 0.44, h * 0.1);
  },
  'npc:scholar': (ctx, w, h) => {
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(0, -h * 0.25, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0277bd';
    ctx.fillRect(-w * 0.16, -h * 0.05, w * 0.32, h * 0.35);
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(-w * 0.22, h * 0.3, w * 0.44, h * 0.1);
  },
  'npc:ranger': (ctx, w, h) => {
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.arc(0, -h * 0.25, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(-w * 0.16, -h * 0.05, w * 0.32, h * 0.35);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-w * 0.22, h * 0.3, w * 0.44, h * 0.1);
  },
  'npc:oracle': (ctx, w, h) => {
    ctx.fillStyle = '#ce93d8';
    ctx.beginPath();
    ctx.arc(0, -h * 0.25, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a1b9a';
    ctx.fillRect(-w * 0.16, -h * 0.05, w * 0.32, h * 0.35);
    ctx.fillStyle = '#9575cd';
    ctx.fillRect(-w * 0.22, h * 0.3, w * 0.44, h * 0.1);
  }
};

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
    const drawer = PROCEDURAL_DRAWERS[textureKey];
    if (texture?.image) {
      const { image, frame } = texture;
      this.ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
    } else if (drawer) {
      drawer(this.ctx, w, h);
    } else {
      this.ctx.fillStyle = this.resolveColor(textureKey);
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

  private resolveColor(key: string): string {
    const exact = COLOR_PALETTE[key];
    if (exact) {
      return exact;
    }
    const base = COLOR_PALETTE[key.split(':')[0]];
    if (base) {
      return base;
    }
    return this.colorForKey(key);
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
