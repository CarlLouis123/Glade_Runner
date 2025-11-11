import { SceneManager } from './scene-manager';
import { InputManager } from './input';
import { Renderer } from './renderer';
import { FpsCounter, now } from './time';

export interface Scene {
  init(): Promise<void> | void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  dispose(): void;
}

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly renderer: Renderer;
  readonly input: InputManager;
  readonly sceneManager: SceneManager;
  readonly fpsCounter: FpsCounter;
  private readonly hudElement: HTMLElement | null;
  private lastTime = now();
  private accumulator = 0;
  private running = false;
  private rafId: number | null = null;
  private readonly fixedDt = 1000 / 60;
  private currentSceneName = 'Unknown';
  private hudOverlay = '';
  readonly offscreenSupported: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.tabIndex = 1;
    this.canvas.focus();
    this.offscreenSupported = typeof (this.canvas as HTMLCanvasElement & {
      transferControlToOffscreen?: () => OffscreenCanvas;
    }).transferControlToOffscreen === 'function';

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire 2D context');
    }
    this.ctx = context;
    this.renderer = new Renderer(context);
    this.input = new InputManager();
    this.sceneManager = new SceneManager();
    this.fpsCounter = new FpsCounter();
    this.hudElement = document.getElementById('hud');

    this.canvas.addEventListener('mousedown', () => this.canvas.focus());
    this.input.attach(this.canvas);
    this.resize();
  }

  async start(): Promise<void> {
    this.running = true;
    this.lastTime = now();
    this.accumulator = 0;
    this.scheduleNextFrame();
  }

  async setScene(scene: Scene): Promise<void> {
    this.currentSceneName = scene.constructor.name;
    await this.sceneManager.replace(scene);
  }

  getCurrentSceneName(): string {
    return this.currentSceneName;
  }

  setHudOverlay(text: string): void {
    this.hudOverlay = text;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth * dpr;
    const height = window.innerHeight * dpr;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.renderer.setViewport(window.innerWidth, window.innerHeight);
  }

  pause(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = now();
    this.scheduleNextFrame();
  }

  updateHud(content: string): void {
    if (this.hudElement) {
      const overlay = this.hudOverlay ? `\n${this.hudOverlay}` : '';
      this.hudElement.textContent = `${content}${overlay}`;
    }
  }

  private scheduleNextFrame(): void {
    this.rafId = requestAnimationFrame((time) => void this.frame(time));
  }

  private async frame(time: number): Promise<void> {
    if (!this.running) {
      return;
    }

    const delta = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += delta;

    while (this.accumulator >= this.fixedDt) {
      await this.sceneManager.update(this.fixedDt / 1000);
      this.accumulator -= this.fixedDt;
    }

    this.renderer.clear();
    this.sceneManager.render(this.ctx);
    this.renderer.flushDebug();

    const fps = this.fpsCounter.update();
    this.updateHud(`Scene: ${this.currentSceneName}\nFPS: ${fps.toFixed(1)}`);

    this.input.tick();

    if (this.running) {
      this.scheduleNextFrame();
    }
  }
}
