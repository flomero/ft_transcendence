import { STRATEGY_REGISTRY } from "./strategyRegistryLoader";

/**
 * A generic StrategyManager that:
 * 1. Uses a registry key to load strategy classes from the global STRATEGY_REGISTRY.
 * 2. Maintains an instance of a strategy.
 * 3. Provides an executeStrategy method that calls the strategy's primary function.
 *
 * @template T - The strategy interface/type.
 * @template K - The key of T that represents the primary method (e.g. "samplePosition" or "nextMove").
 */
export class StrategyManager<T, K extends keyof T> {
  private strategy: T;
  private strategyTypeName: string;
  private defaultMethod: K;

  /**
   * @param initialStrategyName The name of the initial strategy (as defined in the registry).
   * @param strategyTypeName The key in STRATEGY_REGISTRY for this strategy type.
   * @param defaultMethod The method name on the strategy that is its primary "purpose" (e.g. "samplePosition").
   */
  constructor(
    initialStrategyName: string,
    strategyTypeName: string,
    defaultMethod: K,
  ) {
    this.strategyTypeName = strategyTypeName;
    this.defaultMethod = defaultMethod;

    console.log("StrategyManager received:");
    console.dir(initialStrategyName, { depth: null });
    console.dir(strategyTypeName, { depth: null });
    console.dir(defaultMethod, { depth: null });

    console.log("\nRegistry");
    console.dir(STRATEGY_REGISTRY, { depth: null });

    const strategyClass =
      STRATEGY_REGISTRY[strategyTypeName]?.[initialStrategyName].class;
    if (!strategyClass) {
      throw new Error(
        `Strategy "${initialStrategyName}" not found under "${strategyTypeName}"`,
      );
    }

    this.strategy = new strategyClass();
  }

  /**
   * Returns the current strategy instance.
   */
  public getStrategy(): T {
    return this.strategy;
  }

  /**
   * Sets a new strategy by name.
   * It uses the global STRATEGY_REGISTRY to look up the corresponding class,
   * instantiates it, and replaces the current strategy.
   *
   * @param strategyName The name of the strategy (as defined in the registry).
   */
  public setStrategy(strategyName: string): void {
    const strategies = STRATEGY_REGISTRY[this.strategyTypeName];
    if (!strategies) {
      throw new Error(
        `No strategies found for registry key: ${this.strategyTypeName}`,
      );
    }
    const strategyClass = strategies[strategyName].class;
    if (!strategyClass) {
      throw new Error(
        `Strategy "${strategyName}" not found under ${this.strategyTypeName}`,
      );
    }
    this.strategy = new strategyClass();
  }

  /**
   * Executes the primary function of the current strategy.
   *
   * The arguments passed to executeStrategy are forwarded to the strategy's primary method.
   * The return value is also type-safe based on the method's signature.
   *
   * @param args Arguments required by the strategy's primary method.
   * @returns The result of calling the strategy's primary method.
   */
  public executeStrategy(
    ...args: T[K] extends (...args: infer A) => any ? A : never
  ): T[K] extends (...args: any[]) => infer R ? R : never {
    const method = this.strategy[this.defaultMethod];
    if (typeof method !== "function") {
      throw new Error(
        `The default method ${String(this.defaultMethod)} is not a function`,
      );
    }
    return method.apply(this.strategy, args);
  }
}
