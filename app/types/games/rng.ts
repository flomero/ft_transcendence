export interface IRNG {
  random(): number;
  randomGaussian(center: number, halfSpan: number): number;
  randomInt(min?: number, max?: number): number;
  randomSign(posBias?: number): number;
  randomWeighted(weights: number[]): number;
  randomArray<T>(array: T[]): T[];
  setSeed(seed: number): void;
  getSeed(): number;
  setState(state: number): void;
  getState(): number;
}
