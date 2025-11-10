export const now = (): number => performance.now();

export class FpsCounter {
  private readonly samples: number[] = [];
  private lastSample = now();
  private fpsValue = 0;

  update(): number {
    const current = now();
    const delta = current - this.lastSample;
    this.lastSample = current;
    if (delta > 0) {
      const fps = 1000 / delta;
      this.samples.push(fps);
      if (this.samples.length > 60) {
        this.samples.shift();
      }
      this.fpsValue = this.samples.reduce((acc, value) => acc + value, 0) / this.samples.length;
    }
    return this.fpsValue;
  }

  get fps(): number {
    return this.fpsValue;
  }
}
