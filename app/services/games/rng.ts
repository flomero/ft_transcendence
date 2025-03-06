export class RNG {
  protected seed: number = Date.now();
  protected state: number;

  constructor() {
    this.state = this.seed;
  }

  random(): number {
    this.state = (this.state * 9301 + 49297) % 233280;
    return this.state / 233280;
  }

  // Getters & setters
  setSeed(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  getSeed(): number {
    return this.seed;
  }

  setState(state: number) {
    this.state = state;
  }

  getState(): number {
    return this.state;
  }
}
