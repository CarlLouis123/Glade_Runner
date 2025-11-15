const MOVEMENT_KEYS = new Map<string, keyof MovementState>([
  ['KeyW', 'forward'],
  ['ArrowUp', 'forward'],
  ['KeyS', 'backward'],
  ['ArrowDown', 'backward'],
  ['KeyA', 'left'],
  ['KeyD', 'right'],
  ['ArrowLeft', 'turnLeft'],
  ['ArrowRight', 'turnRight'],
  ['KeyQ', 'turnLeft'],
  ['KeyE', 'turnRight'],
  ['ShiftLeft', 'sprint'],
  ['ShiftRight', 'sprint']
]);

export interface MovementState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  sprint: boolean;
}

const createInitialState = (): MovementState => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  turnLeft: false,
  turnRight: false,
  sprint: false
});

export class InputController {
  private readonly state: MovementState = createInitialState();
  private readonly nextState: MovementState = createInitialState();
  private yawDelta = 0;

  constructor() {
    window.addEventListener('keydown', (event) => this.onKey(event, true));
    window.addEventListener('keyup', (event) => this.onKey(event, false));

    window.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('canvas')) {
        this.pointerActive = true;
      }
    });

    window.addEventListener('pointerup', () => {
      this.pointerActive = false;
    });

    window.addEventListener('pointerleave', () => {
      this.pointerActive = false;
    });

    window.addEventListener('pointermove', (event) => {
      if (!this.pointerActive) {
        return;
      }
      this.yawDelta += event.movementX * 0.0025;
    });
  }

  private pointerActive = false;

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    const key = MOVEMENT_KEYS.get(event.code);
    if (!key) {
      return;
    }

    if (key === 'sprint') {
      this.nextState.sprint = pressed;
      return;
    }

    if (key === 'turnLeft') {
      this.nextState.turnLeft = pressed;
      event.preventDefault();
      return;
    }

    if (key === 'turnRight') {
      this.nextState.turnRight = pressed;
      event.preventDefault();
      return;
    }

    this.nextState[key] = pressed;
    event.preventDefault();
  }

  update(): void {
    Object.assign(this.state, this.nextState);
  }

  consumeYaw(): number {
    const delta = this.yawDelta;
    this.yawDelta = 0;
    return delta;
  }

  get movement(): MovementState {
    return this.state;
  }
}
