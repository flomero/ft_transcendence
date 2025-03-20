import type { GAME_MODES } from "../../../schemas/games/lobby/newLobbySchema";

type GameMode = (typeof GAME_MODES)[keyof typeof GAME_MODES];

interface PowerUpCapacities {
  speedBoost: number;
}

interface CustomizableSettings {
  ballSpeedWidthPercentS: number;
  ballRadius: number;
  paddleCoveragePercent: number;
  paddleSpeedWidthPercentS: number;
  powerUpRadius: number;
  powerUpCapacities: PowerUpCapacities;
}

interface PowerUpSpawner {
  className: "PowerUpSpawner";
  meanDelayS: number;
  delaySpanS: number;
}

interface TimedGame {
  className: "TimedGame";
  durationS: number;
}

interface ScoredGame {
  className: "ScoredGame";
  goalObjective: number;
}

interface SurvivalGame {
  className: "SurvivalGame";
}

interface Elimination {
  className: "Elimination";
  threshold: number;
}

interface ArenaShrink {
  className: "ArenaShrink";
}

interface GameModifiers {
  powerUpSpawner?: PowerUpSpawner;
  timedGame?: TimedGame;
  scoredGame?: ScoredGame;
  survivalGame?: SurvivalGame;
  elimination?: Elimination;
  arenaShrink?: ArenaShrink;
}

interface GameSettings {
  gameName: "pong";
  gameMode: GameMode;
  customizableSettings: CustomizableSettings;
  gameModifiers?: GameModifiers;
}

export type { GameSettings };
