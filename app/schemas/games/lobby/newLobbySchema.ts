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
  .prop("meanDelay", S.number())
  .prop("delaySpan", S.number())
  .prop("positionSamplerStrategyName", S.string());

const timedGameSchema = S.object().prop("duration", S.number().minimum(0));
const scoredGameSchema = S.object().prop(
  "goalObjective",
  S.number().minimum(0),
);
const eliminationSchema = S.object().prop("threshold", S.number().minimum(0));
const goalResetSchema = S.object().prop("delay", S.number().minimum(0));
const idleWallBounceAccelerationSchema = S.object().prop(
  "bumperVelocityFactor",
  S.number(),
);
const paceBreakerSchema = S.object()
  .prop("noResetThreshold", S.number())
  .prop("noPaddleBounceThreshold", S.number());

const modifierNamesSchema = S.object()
  .prop("powerUpSpawner", powerUpSpawnerSchema)
  .prop("timedGame", timedGameSchema)
  .prop("scoredGame", scoredGameSchema)
  .prop("survivalGame", S.object().maxProperties(0))
  .prop("elimination", eliminationSchema)
  .prop("arenaShrink", S.object().maxProperties(0))
  .prop("goalReset", goalResetSchema)
  .prop("paddleBoost", S.object().maxProperties(0))
  .prop("timedStart", S.object().maxProperties(0))
  .prop("idleWallBounceAcceleration", idleWallBounceAccelerationSchema)
  .prop("paceBreaker", paceBreakerSchema);

// PowerUp Sub-Schemas
const speedBoostSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("rampUpStrengthFactor", S.number())
  .prop("rampUpStrength", S.number());

const blinkingBallSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("blinkInterval", S.number())
  .prop("blinkDuration", S.number());

const shooterSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("chargeDuration", S.number())
  .prop("chargeRadius", S.number())
  .prop("shootAdditionalVelocity", S.number())
  .prop("playerSamplerStrategyName", S.string());

const multiBallSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("ballCount", S.number())
  .prop("totalAngle", S.number())
  .prop("radiusFactor", S.number());

const bumperSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("bumperJunctionDistanceFromCenter", S.number())
  .prop("bumperWallJunctionDistance", S.number())
  .prop("bumperVelocityFactor", S.number())
  .prop("bumperMaxVelocityFactor", S.number())
  .prop("bumperAcceleration", S.number());

const portalsSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("portalWallWidthHeightFactor", S.number())
  .prop("directionalOffsetFactor", S.number())
  .prop("directionalOffsetStandardDeviationFactor", S.number())
  .prop("normalOffsetFactor", S.number())
  .prop("normalOffsetStandardDeviationFactor", S.number())
  .prop("useWallSide", S.boolean())
  .prop("useBothSides", S.boolean())
  .prop("teleportationCountThrehsold", S.number());

const speedGateSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("duration", S.number())
  .prop("initialBallSizeSmallPortalWidthFactor", S.number())
  .prop("initialBallSizeBigPortalWidthFactor", S.number())
  .prop("portalWidthArenaHeightFactor", S.number())
  .prop("portalUseThreshold", S.number())
  .prop("meanSpeedGateDstFromCenterFactor", S.number())
  .prop("stdDevSpeedGateDstFromCenterFactor", S.number())
  .prop("sizeFactor", S.number())
  .prop("speedFactor", S.number());

const protectedPowerUpSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("powerUpName", S.string())
  .prop("powerUpRadiusWidthFactor", S.number())
  .prop("wellRadiusWidthFactor", S.number())
  .prop("speedMultiplier", S.number())
  .prop("meanSpawnRadiusHeightFactor", S.number())
  .prop("stdDevSpawnRadiusHeightFactor", S.number());

const bumperShieldSchema = S.object()
  .prop("spawnWeight", S.number())
  .prop("speedMultiplier", S.number())
  .prop("wallsHitThresold", S.number())
  .prop("wallTotalWidthArenaWidthFactor", S.number())
  .prop("wallJunctionArenaWidthFactor", S.number())
  .prop("wallGoalOffsetArenaWidthFactor", S.number());

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
  .additionalProperties(false)
  .prop("gameName", S.enum(Object.values(GAME_NAMES)).required())
  .prop("gameModeName", S.enum(Object.values(GAME_MODES)).required())
  .prop("playerCount", S.number().minimum(1).required())
  .prop("modifierNames", modifierNamesSchema.required())
  .prop("powerUpNames", powerUpNamesSchema.required())
  .prop("gameModeConfig", gameModeConfigSchema);

export const newLobbySchema = {
  body: gameSettingsSchema,
};

export default newLobbySchema;
