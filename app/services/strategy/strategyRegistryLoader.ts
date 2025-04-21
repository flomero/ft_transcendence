import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { StrategyRegistry } from "../../types/strategy/strategyRegistry";

// Export the global strategy registry
export const STRATEGY_REGISTRY: StrategyRegistry = {};

/**
 * Loads the strategy registry from a JSON file and dynamically imports
 * each strategy module, storing both the class and any additional parameters.
 */
export async function loadStrategyRegistry(): Promise<void> {
  const jsonPath = path.resolve(__dirname, "../../../strategyRegistry.json");

  let jsonData: string;
  try {
    jsonData = await fs.readFile(jsonPath, "utf-8");
  } catch (err) {
    throw new Error(`Strategy registry JSON not found at ${jsonPath}`);
  }

  // Parse the JSON file into the expected structure
  const registry = JSON.parse(jsonData) as StrategyRegistry;

  // Iterate through strategy types
  for (const strategyType in registry) {
    if (!registry.hasOwnProperty(strategyType)) continue;

    const strategies = registry[strategyType];

    for (const strategyName in strategies) {
      if (!strategies.hasOwnProperty(strategyName)) continue;

      const strategyData = strategies[strategyName];
      const { className, ...configParams } = strategyData; // Separate className from config params

      // Construct module path
      const modulePath = path.join(
        __dirname,
        strategyType.toLowerCase(),
        className.toLowerCase() + ".js",
      );

      try {
        // Import the module dynamically
        const module = await import(modulePath);
        if (!module[className]) {
          throw new Error(`Module ${modulePath} does not export ${className}`);
        }

        // Store the actual class and additional parameters in the registry
        strategyData.class = module[className];

        // Preserve other configuration parameters
        Object.assign(strategyData, configParams);
      } catch (err) {
        console.error(
          `Error importing strategy "${strategyName}" for type "${strategyType}" from ${modulePath}:`,
          err,
        );
      }
    }
  }

  // Populate the exported registry
  Object.assign(STRATEGY_REGISTRY, registry);
  console.log("Loaded STRATEGY_REGISTRY:", STRATEGY_REGISTRY);
}
