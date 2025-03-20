import S from "fluent-json-schema";

export const GAME_MODES = {
  CLASSIC: "ClassicPong",
  MULTIPLAYER: "MultiplayerPong",
} as const;

const powerUpCapacitiesSchema = S.object().prop(
  "speedBoost",
  S.number().required(),
);

const customizableSettingsSchema = S.object()
  .prop("ballSpeedWidthPercentS", S.number())
  .prop("ballRadius", S.number())
  .prop("paddleCoveragePercent", S.number())
  .prop("paddleSpeedWidthPercentS", S.number())
  .prop("powerUpRadius", S.number())
  .prop("powerUpCapacities", powerUpCapacitiesSchema);

const powerUpSpawnerSchema = S.object()
  .prop("className", S.const("PowerUpSpawner"))
  .prop("meanDelayS", S.number())
  .prop("delaySpanS", S.number());

const timedGameSchema = S.object()
  .prop("className", S.const("TimedGame"))
  .prop("durationS", S.number());

const scoredGameSchema = S.object()
  .prop("className", S.const("ScoredGame"))
  .prop("goalObjective", S.number());

const survivalGameSchema = S.object().prop(
  "className",
  S.const("SurvivalGame"),
);

const eliminationSchema = S.object()
  .prop("className", S.const("Elimination"))
  .prop("threshold", S.number());

const arenaShrinkSchema = S.object().prop("className", S.const("ArenaShrink"));

const gameModifiersSchema = S.object()
  .prop("powerUpSpawner", powerUpSpawnerSchema)
  .prop("timedGame", timedGameSchema)
  .prop("scoredGame", scoredGameSchema)
  .prop("survivalGame", survivalGameSchema)
  .prop("elimination", eliminationSchema)
  .prop("arenaShrink", arenaShrinkSchema);

const bodySchema = S.object()
  .prop("gameName", S.string().required())
  .prop("gameMode", S.enum(Object.values(GAME_MODES)).required())
  .prop("customizableSettings", customizableSettingsSchema)
  .prop("gameModifiers", gameModifiersSchema);

const newLobbySchema = {
  body: bodySchema,
};

export default newLobbySchema;
