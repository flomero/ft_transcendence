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
  private loadedStrategies: Record<string, T> = {};
  private currentStrategy: string;
  private strategyTypeName: string;
  private defaultMethod: K;

  /**
   * @param initialStrategyName The name of the initial strategy (as defined in the registry).
   * @param strategyTypeName The key in STRATEGY_REGISTRY for this strategy type.
   * @param defaultMethod The method name on the strategy that is its primary "purpose" (e.g. "samplePosition").
   * @param initialStrategyArgs Optional arguments to be passed to the initial strategy's constructor.
   */
  constructor(
    initialStrategyName: string,
    strategyTypeName: string,
    defaultMethod: K,
    initialStrategyArgs: any[] = [],
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

    this.loadedStrategies[initialStrategyName] = new strategyClass(
      ...initialStrategyArgs,
    );
    this.currentStrategy = initialStrategyName;
  }

  /**
   * Returns the current strategy instance.
   */
  public getStrategy(): T {
    return this.loadedStrategies[this.currentStrategy];
  }

  /**
   * Sets a new strategy by name.
   * It uses the global STRATEGY_REGISTRY to look up the corresponding class,
   * instantiates it, and replaces the current strategy.
   *
   * @param strategyName The name of the strategy (as defined in the registry).
   * @param args Optional arguments to be passed to the strategy's constructor if a new instance is created.
   */
  public setStrategy(strategyName: string, args: any[] = []): void {
    const strategy = this.loadedStrategies[strategyName];
    if (strategy) {
      this.currentStrategy = strategyName;
      return;
    }

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

    this.loadedStrategies[strategyName] = new strategyClass(...args);
    this.currentStrategy = strategyName;
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
    const method =
      this.loadedStrategies[this.currentStrategy][this.defaultMethod];
    if (typeof method !== "function") {
      throw new Error(
        `The default method ${String(this.defaultMethod)} is not a function`,
      );
    }
    return method.apply(this.loadedStrategies[this.currentStrategy], args);
  }
}
