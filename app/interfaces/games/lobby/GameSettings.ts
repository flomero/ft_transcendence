import type { GAME_MODES } from "../../../schemas/games/lobby/newLobbySchema";

type GameMode = (typeof GAME_MODES)[keyof typeof GAME_MODES];

interface PowerUpCapacities {
  speedBoost: number;
}

interface GameModeConfig {
  ballSpeedWidthPercentS?: number;
  ballRadius?: number;
  paddleCoveragePercent?: number;
  paddleSpeedWidthPercentS?: number;
  powerUpRadius?: number;
  powerUpCapacities?: PowerUpCapacities;
}

interface PowerUpSpawner {
  meanDelayS?: number;
  delaySpanS?: number;
}

interface TimedGame {
  durationS: number;
}

interface ScoredGame {
  goalObjective: number;
}

interface Elimination {
  threshold: number;
}

interface ModifierNames {
  powerUpSpawner?: PowerUpSpawner;
  timedGame?: TimedGame;
  scoredGame?: ScoredGame;
  survivalGame?: {};
  elimination?: Elimination;
  arenaShrink?: {};
}

interface SpeedBoost {
  spawnWeight?: number;
  selfActivation?: boolean;
  durationS?: number;
  totalRampUpStrength?: number;
  rampUpFrequencyS?: number;
}

interface PowerUp {
  speedBoost: SpeedBoost;
}

interface GameSettings {
  gameName: "pong";
  gameModeName: GameMode;
  playerCount: number;
  gameModeConfig?: GameModeConfig;
  modifierNames?: ModifierNames;
  powerUpNames?: PowerUp;
}

export type { GameSettings };
