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

  randomGaussian(center: number, span: number): number {
    // For 95% confidence interval, span = 2 * halfSpan = 2 * 1.96 * stdDev
    // So stdDev = span / (2 * 1.96) = span / 3.92
    const stdDev = span / 3.92;

    // Box-Muller transform
    const u1 = 1.0 - this.random(); // Subtract from 1 to avoid logarithm of zero
    const u2 = 1.0 - this.random();

    // Create a standard normal distribution (mean 0, stdDev 1)
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Transform to desired distribution with center and calculated stdDev
    let result = center + stdDev * z0;

    return result;
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
