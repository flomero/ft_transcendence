import S from "fluent-json-schema";

export const GAME_MODES = {
  CLASSIC: "classicPong",
  MULTIPLAYER: "multiplayerPong",
} as const;

export const GAME_NAMES = {
  PONG: "pong",
} as const;

// PowerUpCapacities
const powerUpCapacitiesSchema = S.object().additionalProperties(S.number());

// GameModeConfig
const gameModeConfigSchema = S.object()
  .prop("ballSpeedWidthPercentS", S.number())
  .prop("ballRadius", S.number())
  .prop("ballResetSampler", S.string())
  .prop("paddleCoveragePercent", S.number())
  .prop("paddleSpeedWidthPercentS", S.number())
  .prop("paddleVelocityAngularTransmissionPercent", S.number().minimum(0))
  .prop("paddleVelocitySpeedTransmissionPercent", S.number().minimum(0))
  .prop("powerUpRadius", S.number())
  .prop("powerUpCapacities", powerUpCapacitiesSchema);

// Modifier Sub-Schemas
const powerUpSpawnerSchema = S.object()
  .prop("meanDelayS", S.number())
  .prop("delaySpanS", S.number())
  .prop("positionSamplerStrategyName", S.string());

const timedGameSchema = S.object().prop("durationS", S.number().minimum(0));
const scoredGameSchema = S.object().prop(
  "goalObjective",
  S.number().minimum(0),
);
const eliminationSchema = S.object().prop("threshold", S.number().minimum(0));
const goalResetSchema = S.object().prop("delayS", S.number().minimum(0));
const idleWallBounceAccelerationSchema = S.object().prop(
  "bumperVelocityFactor",
  S.number(),
);
const paceBreakerSchema = S.object()
  .prop("noResetThreshold", S.number())
  .prop("noPaddleBounceThreshold", S.number());

// The modifierNames schema with ONLY powerUpSpawner, goalReset, and paceBreaker required
const modifierNamesSchema = S.object()
  .prop("powerUpSpawner", powerUpSpawnerSchema.required())
  .prop("timedGame", timedGameSchema)
  .prop("scoredGame", scoredGameSchema)
  .prop("survivalGame", S.array())
  .prop("elimination", eliminationSchema)
  .prop("arenaShrink", S.array())
  .prop("goalReset", goalResetSchema.required())
  .prop("paddleBoost", S.object())
  .prop("timedStart", S.object())
  .prop("idleWallBounceAcceleration", idleWallBounceAccelerationSchema)
  .prop("paceBreaker", paceBreakerSchema.required());

// PowerUp Sub-Schemas
const speedBoostSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number())
  .prop("selfActivation", S.boolean())
  .prop("totalRampUpStrength", S.number())
  .prop("rampUpFrequencyS", S.number());

const blinkingBallSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number())
  .prop("blinkIntervalS", S.number())
  .prop("blinkDurationS", S.number());

const shooterSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number())
  .prop("chargeDurationS", S.number())
  .prop("chargeRadiusS", S.number())
  .prop("shootAdditionalVelocityS", S.number())
  .prop("playerSamplerStrategyName", S.string());

const multiBallSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("ballCount", S.number())
  .prop("spreadAngleDegrees", S.number());

const bumperSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number())
  .prop("bumperJunctionDistanceFromCenter", S.number())
  .prop("bumperWallJunctionDistance", S.number())
  .prop("bumperVelocityFactor", S.number())
  .prop("bumperMaxVelocityFactor", S.number())
  .prop("bumperAcceleration", S.number());

const portalsSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number());

const speedGateSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("durationS", S.number());

const protectedPowerUpSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("powerUpName", S.string());

const bumperShieldSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("speedMultiplier", S.number())
  .prop("wallsHitThresold", S.number());

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
  .additionalProperties(true) // Allow additional properties
  .prop("gameName", S.enum(Object.values(GAME_NAMES)).required())
  .prop("gameModeName", S.enum(Object.values(GAME_MODES)).required())
  .prop("playerCount", S.number().minimum(1).required())
  .prop("lobbyMode", S.string()) // Optional lobby mode
  .prop("modifierNames", modifierNamesSchema.required())
  .prop("powerUpNames", powerUpNamesSchema) // Not required
  .prop("gameModeConfig", gameModeConfigSchema); // Not required

export const newLobbySchema = {
  body: gameSettingsSchema,
};

export default newLobbySchema;
