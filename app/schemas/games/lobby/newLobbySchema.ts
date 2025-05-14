import S from "fluent-json-schema";
import { STRATEGY_REGISTRY } from "../../../services/strategy/strategyRegistryLoader";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";

export const GAME_MODES = {
  CLASSIC: "classicPong",
  MULTIPLAYER: "multiplayerPong",
} as const;

export const GAME_NAMES = {
  PONG: "pong",
} as const;

export const PositionSamplerStrategies = S.enum(
  Object.keys(STRATEGY_REGISTRY.pongPowerUpPositionSampler),
);
export const BallResetSamplerStrategies = S.enum(
  Object.keys(STRATEGY_REGISTRY.pongBallResetSampler),
);
export const PlayerSamplerStrategies = S.enum(
  Object.keys(STRATEGY_REGISTRY.pongPlayerSampler),
);

export const PowerUpNames = S.enum(Object.keys(GAME_REGISTRY.pong.powerUps));

// PowerUpCapacities
const powerUpCapacitiesSchema = S.object()
  .prop("speedBoost", S.integer().minimum(1))
  .prop("blinkingBall", S.integer().minimum(1))
  .prop("shooter", S.integer().minimum(1))
  .prop("multiBall", S.integer().minimum(1))
  .prop("bumper", S.integer().minimum(1))
  .prop("portals", S.integer().minimum(1))
  .prop("speedGate", S.integer().minimum(1))
  .prop("protectedPowerUp", S.integer().minimum(1))
  .prop("bumperShield", S.integer().minimum(1));

// GameModeConfig
const gameModeConfigSchema = S.object()
  .prop("ballSpeedWidthPercentS", S.number().minimum(0.001))
  .prop("ballRadius", S.number().minimum(0.001))
  .prop("ballResetSampler", BallResetSamplerStrategies)
  .prop("paddleCoveragePercent", S.number().minimum(0).maximum(100))
  .prop("paddleSpeedWidthPercentS", S.number().minimum(0.01))
  .prop("paddleVelocityAngularTransmissionPercent", S.number())
  .prop("paddleVelocitySpeedTransmissionPercent", S.number())
  .prop("powerUpRadius", S.number().maximum(100))
  .prop("powerUpCapacities", powerUpCapacitiesSchema);

// Modifier Sub-Schemas
const powerUpSpawnerSchema = S.object()
  .prop("meanDelay", S.number().minimum(0.001))
  .prop("delaySpan", S.number().minimum(0.001))
  .prop("positionSamplerStrategyName", PositionSamplerStrategies)
  .prop("mayhemChance", S.number().minimum(0.001).maximum(100));

const timedGameSchema = S.object().prop("duration", S.number().minimum(0.001));
const scoredGameSchema = S.object().prop(
  "goalObjective",
  S.integer().minimum(1),
);
const eliminationSchema = S.object().prop("threshold", S.integer().minimum(1));
const goalResetSchema = S.object().prop("delay", S.number().minimum(0.001));
const idleWallBounceAccelerationSchema = S.object().prop(
  "bumperVelocityFactor",
  S.number().minimum(0.0001),
);
const paceBreakerSchema = S.object()
  .prop("noResetThreshold", S.number().minimum(0.001))
  .prop("noPaddleBounceThreshold", S.integer().minimum(1))
  .prop("twoPaddlesBounceThreshold", S.integer().minimum(1))
  .prop("onePaddleBounceThreshold", S.integer().minimum(1));

// The modifierNames schema with ONLY powerUpSpawner, goalReset, and paceBreaker required
const modifierNamesSchema = S.object()
  .prop("powerUpSpawner", powerUpSpawnerSchema)
  .prop("timedGame", timedGameSchema)
  .prop("scoredGame", scoredGameSchema)
  .prop("survivalGame", S.object().maxProperties(0))
  .prop("elimination", eliminationSchema)
  .prop("arenaShrink", S.object().maxProperties(0))
  .prop("goalReset", goalResetSchema.required())
  .prop("timedStart", S.object().maxProperties(0))
  .prop("idleWallBounceAcceleration", idleWallBounceAccelerationSchema)
  .prop("paceBreaker", paceBreakerSchema);

// PowerUp Sub-Schemas
const speedBoostSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop("rampUpStrengthFactor", S.number().minimum(0.01))
  .prop("rampUpFrequency", S.number().minimum(0.001));

const blinkingBallSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop("blinkInterval", S.number().minimum(0.001))
  .prop("blinkDuration", S.number().minimum(0.001).maximum(100));

const shooterSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop("chargeDuration", S.number().minimum(0.001))
  .prop("chargeRadius", S.number().minimum(0.001))
  .prop("shootAdditionalVelocity", S.number().minimum(0.001))
  .prop("playerSamplerStrategyName", PlayerSamplerStrategies);

const multiBallSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop("ballCount", S.integer().minimum(1).maximum(36))
  .prop("totalAngle", S.number().minimum(0.001).maximum(360))
  .prop("radiusFactor", S.number().minimum(0.001).maximum(1));

const bumperSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop(
    "bumperJunctionDistanceFromCenter",
    S.number().minimum(0.001).maximum(100),
  )
  .prop("bumperWallJunctionDistance", S.number().minimum(0.001).maximum(100))
  .prop("bumperVelocityFactor", S.number().minimum(0.001))
  .prop("bumperMaxVelocityFactor", S.number().minimum(0.001))
  .prop("bumperAcceleration", S.number())
  .prop("bounceThreshold", S.integer().minimum(1));

const portalsSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop("portalWallWidthHeightFactor", S.number().minimum(0.001).maximum(100))
  .prop("directionalOffsetFactor", S.number().minimum(0.001).maximum(100))
  .prop(
    "directionalOffsetStandardDeviationFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop("normalOffsetFactor", S.number().minimum(0.001).maximum(100))
  .prop(
    "normalOffsetStandardDeviationFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop("useWallSide", S.boolean())
  .prop("useBothSides", S.boolean())
  .prop("teleportationCountThreshold", S.integer().minimum(1));

const speedGateSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("duration", S.number().minimum(0.001))
  .prop(
    "initialBallSizeSmallPortalWidthFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop(
    "initialBallSizeBigPortalWidthFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop("portalWidthArenaHeightFactor", S.number().minimum(0.001).maximum(100))
  .prop("portalUseThreshold", S.integer().minimum(1))
  .prop(
    "meanSpeedGateDstFromCenterFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop(
    "stdDevSpeedGateDstFromCenterFactor",
    S.number().minimum(0.001).maximum(100),
  )
  .prop("sizeFactor", S.number().minimum(0.001))
  .prop("speedFactor", S.number().minimum(0.001));

const protectedPowerUpSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("powerUpName", PowerUpNames)
  .prop("powerUpRadiusWidthFactor", S.number().minimum(0.001).maximum(100))
  .prop("wellRadiusWidthFactor", S.number().minimum(0.001).maximum(100))
  .prop("speedMultiplier", S.number().minimum(0.001).maximum(100))
  .prop("meanSpawnRadiusHeightFactor", S.number().minimum(0.001).maximum(100))
  .prop(
    "stdDevSpawnRadiusHeightFactor",
    S.number().minimum(0.001).maximum(100),
  );

const bumperShieldSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0.001))
  .prop("speedMultiplier", S.number().minimum(0.001))
  .prop("wallsHitThresold", S.integer().minimum(1))
  .prop("wallTotalWidthArenaWidthFactor", S.number().minimum(0.001))
  .prop("wallJunctionArenaWidthFactor", S.number().minimum(0.001))
  .prop("wallGoalOffsetArenaWidthFactor", S.number().minimum(0.001));

// The powerUpNames schema with NO required fields, since powers are optional
const powerUpNamesSchema = S.object()
  .prop("speedBoost", speedBoostSchema)
  .prop("blinkingBall", blinkingBallSchema)
  .prop("shooter", shooterSchema)
  .prop("multiBall", multiBallSchema)
  .prop("bumper", bumperSchema)
  .prop("portals", portalsSchema)
  .prop("speedGate", speedGateSchema)
  .prop("protectedPowerUp", protectedPowerUpSchema)
  .prop("bumperShield", bumperShieldSchema);

// Final GameSettings Schema
export const gameSettingsSchema = S.object()
  .prop("gameName", S.enum(Object.values(GAME_NAMES)).required())
  .prop("gameModeName", S.enum(Object.values(GAME_MODES)).required())
  .prop("gameModeConfig", gameModeConfigSchema.required())
  .prop("modifierNames", modifierNamesSchema.required())
  .prop("powerUpNames", powerUpNamesSchema.required())
  .prop("playerCount", S.integer().minimum(1).maximum(16).required());

export const newLobbySchema = {
  body: gameSettingsSchema,
};

export default newLobbySchema;
