import S from "fluent-json-schema";

export const GAME_MODES = {
  CLASSIC: "classicPong",
  MULTIPLAYER: "multiplayerPong",
} as const;

export const GAME_NAMES = {
  PONG: "pong",
} as const;

const powerUpCapacitiesSchema = S.object().prop(
  "speedBoost",
  S.number().required(),
);

const gameModeConfigSchema = S.object()
  .prop("ballSpeedWidthPercentS", S.number())
  .prop("ballRadius", S.number())
  .prop("paddleCoveragePercent", S.number())
  .prop("paddleSpeedWidthPercentS", S.number())
  .prop("powerUpRadius", S.number())
  .prop("powerUpCapacities", powerUpCapacitiesSchema);

const powerUpSpawnerSchema = S.object()
  .prop("meanDelayS", S.number())
  .prop("delaySpanS", S.number());

const timedGameSchema = S.object().prop("durationS", S.number().minimum(0));

const scoredGameSchema = S.object().prop(
  "goalObjective",
  S.number().minimum(0),
);

const eliminationSchema = S.object().prop("threshold", S.number().minimum(0));

const modifierNamesScheama = S.object()
  .prop("powerUpSpawner", powerUpSpawnerSchema)
  .prop("timedGame", timedGameSchema)
  .prop("scoredGame", scoredGameSchema)
  .prop("survivalGame", S.array().maxItems(0).minItems(0))
  .prop("elimination", eliminationSchema)
  .prop("arenaShrink", S.array().maxItems(0).minItems(0));

const speedBoostSchema = S.object()
  .prop("spawnWeight", S.number().minimum(0))
  .prop("selfActivation", S.boolean())
  .prop("durationS", S.number().minimum(0))
  .prop("totalRampUpStrength", S.number().minimum(0))
  .prop("rampUpFrequencyS", S.number().minimum(0));

const powerupSchema = S.object().prop("speedBoost", speedBoostSchema);

const bodySchema = S.object()
  .additionalProperties(false)
  .prop("gameName", S.enum(Object.values(GAME_NAMES)).required())
  .prop("gameModeName", S.enum(Object.values(GAME_MODES)).required())
  .prop("gameModeConfig", gameModeConfigSchema)
  .prop("modifierNames", modifierNamesScheama)
  .prop("powerUpNames", powerupSchema);

const newLobbySchema = {
  body: bodySchema,
};

export default newLobbySchema;
