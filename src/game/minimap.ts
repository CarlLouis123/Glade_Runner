import type { Tilemap } from '@engine/tilemap';
import type { Vec2 } from '@engine/math';
import { GROUND_COLORS, FEATURE_COLORS, GroundTile, FeatureTile } from './world';

interface MiniMapOptions {
  tilemap: Tilemap;
  groundLayer: number[];
  featureLayer: number[];
}

export class MiniMap {
  private readonly tilemap: Tilemap;
  private readonly groundLayer: number[];
  private readonly featureLayer: number[];
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scale = 4;

  constructor(options: MiniMapOptions) {
    this.tilemap = options.tilemap;
    this.groundLayer = options.groundLayer;
    this.featureLayer = options.featureLayer;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.tilemap.width;
    this.canvas.height = this.tilemap.height;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create minimap context');
    }
    this.ctx = context;
    this.drawBaseLayer();
  }

  render(
    target: CanvasRenderingContext2D,
    playerPos: Vec2 | undefined,
    npcPositions: Vec2[],
    viewport: { width: number; height: number }
  ): void {
    const padding = 18;
    const backgroundWidth = this.canvas.width * this.scale + padding * 2;
    const backgroundHeight = this.canvas.height * this.scale + padding * 2;
    const x = viewport.width - backgroundWidth - 24;
    const y = viewport.height - backgroundHeight - 24;

    target.save();
    target.globalAlpha = 0.9;
    this.drawRoundedRect(target, x, y, backgroundWidth, backgroundHeight, 20);
    target.fillStyle = 'rgba(5, 10, 20, 0.85)';
    target.fill();
    target.strokeStyle = 'rgba(135, 196, 255, 0.6)';
    target.lineWidth = 2;
    target.stroke();

    target.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      x + padding,
      y + padding,
      this.canvas.width * this.scale,
      this.canvas.height * this.scale
    );

    const drawMarker = (position: Vec2, color: string, radius = 4): void => {
      const tile = this.tilemap.worldToTile(position);
      const px = x + padding + tile.x * this.scale + this.scale / 2;
      const py = y + padding + tile.y * this.scale + this.scale / 2;
      target.beginPath();
      target.fillStyle = color;
      target.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      target.lineWidth = 1;
      target.arc(px, py, radius, 0, Math.PI * 2);
      target.fill();
      target.stroke();
    };

    if (playerPos) {
      drawMarker(playerPos, '#ffffff', 5);
    }
    npcPositions.forEach((npc) => drawMarker(npc, '#ffeb3b', 3));

    target.restore();
  }

  private drawBaseLayer(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < this.tilemap.height; y += 1) {
      for (let x = 0; x < this.tilemap.width; x += 1) {
        const idx = y * this.tilemap.width + x;
        const ground = this.groundLayer[idx] as GroundTile;
        const feature = this.featureLayer[idx] as FeatureTile;
        this.ctx.fillStyle = GROUND_COLORS[ground] ?? '#1b2838';
        this.ctx.fillRect(x, y, 1, 1);
        if (feature !== FeatureTile.None) {
          this.ctx.fillStyle = FEATURE_COLORS[feature] ?? '#f5f5f5';
          this.ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
