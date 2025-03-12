// Base types for game components
interface PowerUp {
  className: string;
  spawnWeight: number;
  durationS: number;
  [key: string]: any; // For custom properties specific to each power up
}

interface GameModifier {
  className: string;
  [key: string]: any; // For custom properties specific to each modifier
}

export interface BallSettings {
  speed: number;
  radius: number;
  [key: string]: any;
}

export interface ArenaSettings {
  width: number;
  height: number;
  wallHeight: number;
  paddleOffset: number;
  paddleCoverage: number;
  paddleHeight: number;
  paddleSpeedWidthPercent: number;
  [key: string]: any;
}

export interface PowerUpSettings {
  radius: number;
  capacities: Record<string, number>;
  [key: string]: any;
}

interface GameMode {
  className: string;
  arenaSettings: ArenaSettings;
  defaultBallSettings: BallSettings;
  defaultPowerUpSettings: PowerUpSettings;
  [key: string]: any;
  class?: any; // Added during runtime
}

// Game specific structure
interface Game {
  serverTickrateS: number;
  serverMaxDelayTicks: number;
  gameModes: Record<string, GameMode>;
  gameModifiers: Record<string, GameModifier>;
  powerUps: Record<string, PowerUp>;
  [key: string]: any; // For any additional game-specific properties
}

// The complete registry type
export type GameRegistry = Record<string, Game>;

// Export the initialized registry
export let GAME_REGISTRY: GameRegistry = {};

// Utility type for accessing specific game components with type safety
export type GameType = keyof GameRegistry;
export type GameModeType<G extends GameType> =
  keyof GameRegistry[G]["gameModes"];
export type PowerUpType<G extends GameType> = keyof GameRegistry[G]["powerUps"];
export type ModifierType<G extends GameType> =
  keyof GameRegistry[G]["gameModifiers"];

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
