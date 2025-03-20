import { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";

const invalidEliminationOrArenaShrink = (gameSettings: GameSettings) => {
  if (gameSettings.gameModifiers?.survivalGame) return false;
  if (
    gameSettings.gameModifiers?.elimination ||
    gameSettings.gameModifiers?.arenaShrink
  )
    return true;
  return false;
};

const validateGameModifierCheck = (gameSettings: GameSettings) => {
  if (gameSettings.gameModifiers === undefined) return;

  const modifierKeys: Array<keyof typeof gameSettings.gameModifiers> = [
    "timedGame",
    "scoredGame",
    "survivalGame",
  ];

  const selectedModifiers = modifierKeys.filter(
    (key) => gameSettings.gameModifiers?.[key] !== undefined,
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
