export class ConfigManager {
  /**
   * Property configuration for handling custom transformations and dependencies
   */
  private propertyConfigs: Record<
    string,
    {
      fromConfig: (value: any, context: Record<string, any>) => any;
      toConfig?: (value: any, context: Record<string, any>) => any;
      dependencies?: string[];
    }
  > = {};

  constructor() {}

  /**
   * Registers a property configuration with transformations and optional dependencies
   */
  registerPropertyConfig(
    propertyName: string,
    fromConfig: (value: any, context: Record<string, any>) => any,
    toConfig?: (value: any, context: Record<string, any>) => any,
    dependencies?: string[],
  ): void {
    this.propertyConfigs[propertyName] = {
      fromConfig,
      toConfig,
      dependencies,
    };
  }

  /**
   * Loads attributes from a configuration object with custom transformations
   * and saves them into the given container.
   *
   * @param config - Configuration object with keys matching instance properties.
   * @param container - The target object that will receive the loaded values.
   * @returns A Set of attribute names that were successfully set.
   */
  loadSimpleConfigIntoContainer(
    config: Record<string, any>,
    container: Record<string, any>,
  ): Set<string> {
    if (!config || typeof config !== "object") {
      return new Set<string>();
    }

    const attributesSet: Set<string> = new Set<string>();

    for (const [key, value] of Object.entries(config)) {
      // Skip functions and properties not already present in the container.
      if (!(key in container) || typeof container[key] === "function") {
        continue;
      }

      // Apply transformation if configured.
      if (key in this.propertyConfigs) {
        // Skip properties with dependencies.
        if (this.propertyConfigs[key].dependencies) continue;

        // @ts-ignore - We've already checked the property exists.
        container[key] = this.propertyConfigs[key].fromConfig(value);
      } else {
        // Direct assignment for properties without transformations.
        // @ts-ignore - We've already checked the property exists.
        container[key] = value;
      }

      attributesSet.add(key);
    }

    return attributesSet;
  }

  /**
   * Two-phase configuration loading: first initialize all properties into the container,
   * then apply transformations.
   *
   * @param config - Configuration object with keys matching instance properties.
   * @param container - The target object that will receive the loaded values.
   * @returns The number of keys in the configuration object.
   */
  loadComplexConfigIntoContainer(
    config: Record<string, any>,
    container: Record<string, any>,
  ): number {
    if (!config || typeof config !== "object") {
      return 0;
    }

    // Phase 1: Direct property assignment without transformations.
    for (const [key, value] of Object.entries(config)) {
      if (key in container && typeof container[key] !== "function") {
        // @ts-ignore - We've already checked the property exists.
        container[key] = value;
      }
    }

    // Phase 2: Apply registered transformations in order of dependencies.
    this.applyTransformationsIntoContainer(config, container);

    return Object.keys(config).length;
  }

  /**
   * Apply transformations to properties (that have dependencies) based on the configuration.
   *
   * @param config - The original configuration object.
   * @param container - The target object that holds the properties to transform.
   */
  applyTransformationsIntoContainer(
    config: Record<string, any>,
    container: Record<string, any>,
  ): void {
    const processed = new Set<string>();
    const context = { ...config };

    // Get all properties with transformations from the propertyConfigs.
    const propsToProcess = Object.keys(this.propertyConfigs);

    // Process properties in dependency order.
    while (propsToProcess.length > 0) {
      let progress = false;

      for (let i = 0; i < propsToProcess.length; i++) {
        const prop = propsToProcess[i];
        const { dependencies = [] } = this.propertyConfigs[prop];

        // Check if all dependencies are processed.
        if (
          dependencies.every(
            (dep) => processed.has(dep) || !(dep in this.propertyConfigs),
          )
        ) {
          // Update context with the current property value from container.
          context[prop] = container[prop];

          // Apply transformation if the property has one.
          if (prop in this.propertyConfigs) {
            // @ts-ignore
            container[prop] = this.propertyConfigs[prop].fromConfig(
              container[prop],
              context,
            );
          }

          // Mark the property as processed and remove it from the list.
          processed.add(prop);
          propsToProcess.splice(i, 1);
          i--;
          progress = true;
        }
      }

      // Break if no progress is made (i.e. circular dependency).
      if (!progress && propsToProcess.length > 0) {
        console.warn("Cannot resolve transformations for:", propsToProcess);
        break;
      }
    }
  }

  /**
   * Creates a derived property configuration that depends on other properties
   */
  createDerivedProperty(
    propertyName: string,
    derivationFn: (context: Record<string, any>) => any,
    dependencies: string[],
  ): void {
    this.registerPropertyConfig(
      propertyName,
      (value, context) => {
        // If value is explicitly provided, use it; otherwise derive it
        if (value !== undefined) {
          return value;
        }
        return derivationFn(context);
      },
      undefined,
      dependencies,
    );
  }
}
