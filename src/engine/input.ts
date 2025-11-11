interface PointerState {
  x: number;
  y: number;
  isDown: boolean;
}

export class InputManager {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private readonly justReleased = new Set<string>();
  private pointer: PointerState = { x: 0, y: 0, isDown: false };
  private attached = false;

  attach(target: HTMLElement): void {
    if (this.attached) {
      return;
    }
    target.tabIndex = 0;
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
    target.addEventListener('pointerdown', this.handlePointerDown);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('blur', this.reset);
    this.attached = true;
  }

  detach(target: HTMLElement): void {
    if (!this.attached) {
      return;
    }
    target.removeEventListener('keydown', this.handleKeyDown);
    target.removeEventListener('keyup', this.handleKeyUp);
    target.removeEventListener('pointerdown', this.handlePointerDown);
    target.removeEventListener('pointerup', this.handlePointerUp);
    target.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('blur', this.reset);
    this.attached = false;
  }

  tick(): void {
    this.justPressed.clear();
    this.justReleased.clear();
  }

  isPressed(key: string): boolean {
    return this.pressed.has(key);
  }

  wasPressed(key: string): boolean {
    return this.justPressed.has(key);
  }

  wasReleased(key: string): boolean {
    return this.justReleased.has(key);
  }

  getPointer(): PointerState {
    return { ...this.pointer };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }
    const key = event.key;
    if (!this.pressed.has(key)) {
      this.pressed.add(key);
      this.justPressed.add(key);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key;
    if (this.pressed.has(key)) {
      this.pressed.delete(key);
      this.justReleased.add(key);
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointer = { x: event.clientX, y: event.clientY, isDown: true };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.pointer = { x: event.clientX, y: event.clientY, isDown: false };
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.pointer = { ...this.pointer, x: event.clientX, y: event.clientY };
  };

  private readonly reset = (): void => {
    this.pressed.clear();
    this.justPressed.clear();
    this.justReleased.clear();
    this.pointer = { x: 0, y: 0, isDown: false };
  };
}
