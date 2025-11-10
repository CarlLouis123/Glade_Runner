import type { Scene } from './app';

interface SceneState {
  scene: Scene;
  initialized: boolean;
  initializing?: Promise<void>;
}

export class SceneManager {
  private readonly stack: SceneState[] = [];

  get current(): Scene | undefined {
    return this.stack[this.stack.length - 1]?.scene;
  }

  async push(scene: Scene): Promise<void> {
    const state: SceneState = { scene, initialized: false };
    this.stack.push(state);
    await this.initialize(state);
  }

  async replace(scene: Scene): Promise<void> {
    const current = this.stack.pop();
    if (current) {
      current.scene.dispose();
    }
    await this.push(scene);
  }

  pop(): void {
    const current = this.stack.pop();
    current?.scene.dispose();
  }

  async update(dt: number): Promise<void> {
    const state = this.stack[this.stack.length - 1];
    if (!state) {
      return;
    }
    if (!state.initialized) {
      await this.initialize(state);
    }
    state.scene.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const state = this.stack[this.stack.length - 1];
    if (!state || !state.initialized) {
      return;
    }
    state.scene.render(ctx);
  }

  private async initialize(state: SceneState): Promise<void> {
    if (state.initialized) {
      return;
    }
    if (!state.initializing) {
      const result = state.scene.init();
      if (result instanceof Promise) {
        state.initializing = result.then(() => {
          state.initialized = true;
        });
      } else {
        state.initialized = true;
        state.initializing = Promise.resolve();
      }
    }
    await state.initializing;
  }
}
