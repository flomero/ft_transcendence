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

interface IdleWallBounceAcceleration {
  bumperVelocityFactor?: number;
}

interface PaceBreaker {
  noResetThreshold?: number;
  noPaddleBounceThreshold?: number;
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
  idleWallBounceAcceleration?: IdleWallBounceAcceleration;
  paceBreaker?: PaceBreaker;
}

interface SpeedBoost {
  spawnWeight?: number;
  duration?: number;
  rampUpStrengthFactor?: number;
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
  shootAdditionalVelocity?: number;
  playerSamplerStrategyName?: string;
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

interface Portals {
  spawnWeight?: number;
  duration?: number;
  portalWallWidthHeightFactor?: number;
  directionalOffsetFactor?: number;
  directionalOffsetStandardDeviationFactor?: number;
  normalOffsetFactor?: number;
  normalOffsetStandardDeviationFactor?: number;
  useWallSide?: boolean;
  useBothSides?: boolean;
  teleportationCountThrehsold?: number;
}

interface SpeedGate {
  spawnWeight?: number;
  duration?: number;
  initialBallSizeSmallPortalWidthFactor?: number;
  initialBallSizeBigPortalWidthFactor?: number;
  portalWidthArenaHeightFactor?: number;
  portalUseThreshold?: number;
  meanSpeedGateDstFromCenterFactor?: number;
  stdDevSpeedGateDstFromCenterFactor?: number;
  sizeFactor?: number;
  speedFactor?: number;
}

interface PowerUp {
  speedBoost?: SpeedBoost;
  blinkingBall?: BlinkingBall;
  shooter?: Shooter;
  multiBall?: MultiBall;
  bumper?: Bumper;
  portals?: Portals;
  speedGate?: SpeedGate;
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
