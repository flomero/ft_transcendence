export interface Strategy {
  className: string;
  [key: string]: any; // Strategy specific configurable parameters
  class?: any; // Loaded at runtime
}

// Define the type for our strategy registry.
// The key is the strategy type (e.g. "PongPowerUpSampler")
// and the value is an object mapping a strategy name to the actual class.
export type StrategyRegistry = Record<string, StrategyType>;

export type StrategyType = Record<string, Strategy>;
