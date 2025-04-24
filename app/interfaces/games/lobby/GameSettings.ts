import type { GAME_MODES } from "../../../schemas/games/lobby/newLobbySchema";

type GameMode = (typeof GAME_MODES)[keyof typeof GAME_MODES];

interface PowerUpCapacities {
  [powerUpName: string]: number;
}

interface GameModeConfig {
  ballSpeedWidthPercentS?: number;
  ballRadius?: number;
  ballResetSampler?: string;
  paddleCoveragePercent?: number;
  paddleSpeedWidthPercentS?: number;
  paddleVelocityAngularTransmissionPercent?: number;
  paddleVelocitySpeedTransmissionPercent?: number;
  powerUpRadius?: number;
  powerUpCapacities?: PowerUpCapacities;
}

interface PowerUpSpawner {
  meanDelay?: number;
  delaySpan?: number;
  positionSamplerStrategyName?: string;
}

interface TimedGame {
  duration?: number;
}

interface ScoredGame {
  goalObjective?: number;
}

interface Elimination {
  threshold?: number;
}

interface GoalReset {
  delay?: number;
}

interface ModifierNames {
  powerUpSpawner?: PowerUpSpawner;
  timedGame?: TimedGame;
  scoredGame?: ScoredGame;
  survivalGame?: {};
  elimination?: Elimination;
  arenaShrink?: {};
  goalReset?: GoalReset;
  paddleBoost?: {};
  timedStart?: {};
}

interface SpeedBoost {
  spawnWeight?: number;
  duration?: number;
  rampUpFrequency?: number;
  rampUpStrength?: number;
}

interface BlinkingBall {
  spawnWeight?: number;
  duration?: number;
  blinkInterval?: number;
  blinkDuration?: number;
}

interface Shooter {
  spawnWeight?: number;
  duration?: number;
  chargeDuration?: number;
  chargeRadius?: number;
  shootInitialVelocityFactor?: number;
  shootAcceleration?: number;
  shootDirectionSamplerStrategyName?: string;
}

interface MultiBall {
  spawnWeight?: number;
  duration?: number;
  ballCount?: number;
  totalAngle?: number;
  radiusFactor?: number;
}

interface Bumper {
  spawnWeight?: number;
  duration?: number;
  bumperJunctionDistanceFromCenter?: number;
  bumperWallJunctionDistance?: number;
  bumperVelocityFactor?: number;
  bumperMaxVelocityFactor?: number;
  bumperAcceleration?: number;
}

interface PowerUp {
  speedBoost?: SpeedBoost;
  blinkingBall?: BlinkingBall;
  shooter?: Shooter;
  multiBall?: MultiBall;
  bumper?: Bumper;
}

interface GameSettings {
  gameName: "pong";
  gameModeName: GameMode;
  playerCount: number;
  modifierNames: ModifierNames;
  powerUpNames: PowerUp;
  gameModeConfig?: GameModeConfig;
}

export type { GameSettings };
