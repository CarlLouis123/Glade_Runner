import type { Scene } from '@engine/app';
import type { GameApp } from '@engine/app';
import { setLastAction } from '@game/telemetry';
import { Gameplay } from './Gameplay';

export class MainMenu implements Scene {
  private readonly app: GameApp;
  private pulse = 0;

  constructor(app: GameApp) {
    this.app = app;
  }

  init(): void {
    setLastAction('MainMenu:init');
  }

  update(dt: number): void {
    this.pulse += dt;
    if (this.app.input.wasPressed('Enter')) {
      setLastAction('MainMenu:start');
      void this.app.setScene(new Gameplay(this.app));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.app.renderer.getViewport();
    ctx.save();
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e6e6e6';
    ctx.font = '48px var(--font-family, sans-serif)';
    ctx.textAlign = 'center';
    ctx.fillText('GladeRunner', width / 2, height / 2 - 40);
    ctx.font = '20px var(--font-family, sans-serif)';
    const alpha = 0.6 + Math.sin(this.pulse * 3) * 0.2;
    ctx.fillStyle = `rgba(234, 234, 234, ${alpha.toFixed(2)})`;
    ctx.fillText('Press Enter to Start', width / 2, height / 2 + 20);
    ctx.restore();
  }

  dispose(): void {
    // no-op for now
  }
}
