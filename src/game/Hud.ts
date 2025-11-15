interface HudState {
  region: string;
  heading: number;
  pace: number;
  exploration: number;
}

export class Hud {
  private readonly root: HTMLElement;
  private readonly regionEl: HTMLElement;
  private readonly headingEl: HTMLElement;
  private readonly paceEl: HTMLElement;
  private readonly progressEl: HTMLElement;
  private readonly progressBarEl: HTMLElement;

  constructor() {
    const element = document.getElementById('hud');
    if (!element) {
      throw new Error('Expected an element with id="hud"');
    }
    this.root = element;
    this.root.innerHTML = `
      <div class="hud-card">
        <h1 class="hud-title">Glade Runner // Threefold Awakening</h1>
        <p class="hud-region">Region: <span data-region>Inner Grove</span></p>
        <p class="hud-heading">Heading: <span data-heading>0°</span></p>
        <p class="hud-pace">Pace: <span data-pace>0 m/s</span></p>
        <div class="hud-progress">
          <div class="hud-progress-bar"><span data-progress-bar></span></div>
          <small>Exploration <span data-progress>0%</span></small>
        </div>
        <div class="hud-instructions">
          <strong>Controls</strong>
          <ul>
            <li>WASD to move, Shift to sprint</li>
            <li>Hold left mouse button or use Q/E or ←/→ to turn</li>
            <li>Explore the glade and follow the lights to new regions</li>
          </ul>
        </div>
      </div>
    `;

    const regionEl = this.root.querySelector('[data-region]');
    const headingEl = this.root.querySelector('[data-heading]');
    const paceEl = this.root.querySelector('[data-pace]');
    const progressEl = this.root.querySelector('[data-progress]');
    const progressBarEl = this.root.querySelector('[data-progress-bar]');

    if (!regionEl || !headingEl || !paceEl || !progressEl || !progressBarEl) {
      throw new Error('HUD template missing expected elements');
    }

    this.regionEl = regionEl as HTMLElement;
    this.headingEl = headingEl as HTMLElement;
    this.paceEl = paceEl as HTMLElement;
    this.progressEl = progressEl as HTMLElement;
    this.progressBarEl = progressBarEl as HTMLElement;
  }

  update(state: HudState): void {
    this.regionEl.textContent = state.region;
    this.headingEl.textContent = `${state.heading.toFixed(0)}°`;
    this.paceEl.textContent = `${state.pace.toFixed(1)} m/s`;
    const percent = Math.round(state.exploration * 100);
    this.progressEl.textContent = `${percent}%`;
    this.progressBarEl.style.width = `${percent}%`;
  }
}
