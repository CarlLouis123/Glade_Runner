const MOVEMENT_KEYS = new Map<string, keyof MovementState>([
  ['KeyW', 'forward'],
  ['ArrowUp', 'forward'],
  ['KeyS', 'backward'],
  ['ArrowDown', 'backward'],
  ['KeyA', 'left'],
  ['ArrowLeft', 'left'],
  ['KeyD', 'right'],
  ['ArrowRight', 'right'],
  ['ShiftLeft', 'sprint'],
  ['ShiftRight', 'sprint']
]);

export interface MovementState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

const createInitialState = (): MovementState => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false
});

export class InputController {
  private readonly state: MovementState = createInitialState();
  private readonly nextState: MovementState = createInitialState();

  constructor() {
    window.addEventListener('keydown', (event) => this.onKey(event, true));
    window.addEventListener('keyup', (event) => this.onKey(event, false));
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    const key = MOVEMENT_KEYS.get(event.code);
    if (!key) {
      return;
    }

    if (key === 'sprint') {
      this.nextState.sprint = pressed;
      return;
    }

    this.nextState[key] = pressed;
    event.preventDefault();
  }

  update(): void {
    Object.assign(this.state, this.nextState);
  }

  get movement(): MovementState {
    return this.state;
  }
}
