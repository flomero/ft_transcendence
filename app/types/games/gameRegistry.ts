// Base types for game components
export interface PowerUp {
  className: string;
  spawnWeight: number;
  durationS: number;
  [key: string]: any; // For custom properties specific to each power up
}

export interface GameModifier {
  className: string;
  [key: string]: any; // For custom properties specific to each modifier
}

export interface FixedSettings {
  // Arena Settings
  arenaWidth: number;
  arenaHeight: number;

  // Paddle Settings
  paddleOffset: number;
  paddleHeight: number;

  // Wall Settings
  wallsHeight: number;

  // Ball Settings
  minBallSpeed: number;

  [key: string]: any; // any gameMode specific additional fixedSettings
}

export interface CustomizableSettings {
  // Ball Settings
  ballSpeedWidthPercentS: number;
  ballRadius: number;
  ballResetSampler: string;

  // Paddle Settings
  paddleCoveragePercent: number;
  paddleSpeedWidthPercentS: number;
  paddleVelocityAngularTransmissionPercent: number;
  paddleVelocitySpeedTransmissionPercent: number;

  // PowerUp Settings
  powerUpRadius: number;
  powerUpCapacities: Record<string, number>;

  [key: string]: any; // any gameMode specific additional customizableSettings
}

export interface GameMode {
  className: string;
  fixedSettings: FixedSettings;
  customizableSettings: CustomizableSettings;
  [key: string]: any; // Additional properties if needed
  class?: any; // Added at runtime
}

export interface Game {
  serverTickrateS: number;
  serverMaxDelayTicks: number;
  gameModes: Record<string, GameMode>;
  gameModifiers: Record<string, GameModifier>;
  powerUps: Record<string, PowerUp>;
  [key: string]: any;
}

export type GameRegistry = Record<string, Game>;

export type GameType = keyof GameRegistry;
export type GameModeType<G extends GameType> =
  keyof GameRegistry[G]["gameModes"];
export type PowerUpType<G extends GameType> = keyof GameRegistry[G]["powerUps"];
export type ModifierType<G extends GameType> =
  keyof GameRegistry[G]["gameModifiers"];

export type GameModeCombinedSettings = GameMode["fixedSettings"] &
  GameMode["customizableSettings"];

// Helper functions to access the registry with type safety
export function getGame<G extends GameType>(gameName: G): Game {
  return GAME_REGISTRY[gameName];
}

export function getGameMode<G extends GameType, M extends GameModeType<G>>(
  gameName: G,
  modeName: M,
): GameMode {
  return GAME_REGISTRY[gameName].gameModes[modeName as string];
}

export function getPowerUp<G extends GameType, P extends PowerUpType<G>>(
  gameName: G,
  powerUpName: P,
): PowerUp {
  return GAME_REGISTRY[gameName].powerUps[powerUpName as string];
}

export function getGameModifier<G extends GameType, M extends ModifierType<G>>(
  gameName: G,
  modifierName: M,
): GameModifier {
  return GAME_REGISTRY[gameName].gameModifiers[modifierName as string];
}

// Export the initialized registry.
export const GAME_REGISTRY: GameRegistry = {};
