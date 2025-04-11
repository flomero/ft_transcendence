import type { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";

const invalidEliminationOrArenaShrink = (gameSettings: GameSettings) => {
  if (gameSettings.modifierNames?.survivalGame) return false;
  if (
    gameSettings.modifierNames?.elimination ||
    gameSettings.modifierNames?.arenaShrink
  )
    return true;
  return false;
};

const validateGameModifierCheck = (gameSettings: GameSettings) => {
  if (gameSettings.modifierNames === undefined) return;

  const modifierKeys: Array<keyof typeof gameSettings.modifierNames> = [
    "timedGame",
    "scoredGame",
    "survivalGame",
  ];

  const selectedModifiers = modifierKeys.filter(
    (key) => gameSettings.modifierNames?.[key] !== undefined,
  );

  if (selectedModifiers.length > 1) {
    throw new Error(
      "Only one of timedGame, scoredGame, or survivalGame is allowed.",
    );
  }

  if (invalidEliminationOrArenaShrink(gameSettings) === true) {
    throw new Error(
      "survivalGame must be enabled to enable elimination or arenaShrink.",
    );
  }
};

export default validateGameModifierCheck;
