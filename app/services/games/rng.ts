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

  randomGaussian(center: number, halfSpan: number): number {
    // For 95% confidence interval, span = 2 * halfSpan = 2 * 1.96 * stdDev
    // So stdDev = span / (2 * 1.96) = halfSpan / 1.96
    const stdDev = halfSpan / 1.96;

    // Box-Muller transform
    const u1 = 1.0 - this.random(); // Subtract from 1 to avoid logarithm of zero
    const u2 = 1.0 - this.random();

    // Create a standard normal distribution (mean 0, stdDev 1)
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Transform to desired distribution with center and calculated stdDev
    const result = center + stdDev * z0;

    return result;
  }

  randomInt(min: number = 0, max: number = 1): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomSign(posBias: number = 0.5): number {
    return this.random() < posBias ? 1 : -1;
  }

  randomWeighted(weights: number[]): number {
    if (weights.length === 0) return 0;

    const totalWeight = weights.reduce((prev, curr) => prev + curr);
    if (totalWeight === 0) return this.randomInt(0, weights.length - 1);
    const unitPdf = weights.map((weight) => weight / totalWeight);

    let cumul = 0;
    const cdf = [];
    for (const density of unitPdf) {
      cumul += density;
      cdf.push(cumul);
    }

    const rnd = this.random();
    for (const cumulDensity of cdf)
      if (rnd < cumulDensity) return cdf.indexOf(cumulDensity);

    // fallback -> any element
    return this.randomInt(0, weights.length - 1);
  }

  randomArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
