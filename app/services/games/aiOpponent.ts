import { RNG } from "./rng";

export interface AIData {
  playerId: number;
  strategyName: string;
}

export abstract class AIOpponent {
  protected tickrateS: number = 1;
  protected data: AIData;
  protected game: any; // Abstract class doesn't assume a specific game type
  protected rng: RNG = new RNG();

  constructor(game: any, data: AIData) {
    this.game = game;
    this.data = data;
  }

  // Called once per second to update the AI's view of the game
  abstract update(): void;

  abstract startActionScheduler(): void;

  getRNG(): RNG {
    return this.rng;
  }

  getId(): number {
    return this.data.playerId;
  }
}
