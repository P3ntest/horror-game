export class Ticker {
  constructor(private callback: (deltaTime: number) => void) {}

  tps: number = 60;
  get framePeriod() {
    return 1000 / this.tps;
  }

  lastTickTime: number = 0;
  running: boolean = false;

  tick() {
    if (!this.running) {
      return;
    }
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    this.callback(deltaTime);
    setTimeout(() => this.tick(), this.framePeriod);
  }

  start() {
    this.running = true;
    this.lastTickTime = Date.now();
    this.tick();
  }

  stop() {
    this.running = false;
  }
}
