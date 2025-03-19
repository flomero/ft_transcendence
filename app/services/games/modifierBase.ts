import type { GameBase } from "./gameBase";

export enum ModifierStatus {
  INACTIVE,
  PAUSED,
  ACTIVE,
}

export enum ModifierActivationMode {
  AUTO,
  SELF,
}

export class ModifierBase {
  name: string = "";

  protected spawnWeight: number = 0;
  protected status: ModifierStatus = ModifierStatus.INACTIVE;
  protected activationMode: ModifierActivationMode =
    ModifierActivationMode.AUTO;

  protected playerId: number = -1;

  /**
   * Property configuration for handling custom transformations and dependencies
   */
  protected propertyConfigs: Record<
    string,
    {
      fromConfig: (value: any, context: Record<string, any>) => any;
      toConfig?: (value: any, context: Record<string, any>) => any;
      dependencies?: string[];
    }
  > = {};

  constructor() {}

  protected makeCompleteConfig(
    defaultConfig: Record<string, any>,
    customConfig?: Record<string, any>,
  ): Record<string, any> {
    if (!customConfig) return defaultConfig;

    for (const [key, value] of Object.entries(customConfig))
      if (key in Object.keys(defaultConfig)) defaultConfig[key] = value;

    return defaultConfig;
  }

  /**
   * Registers a property configuration with transformations and optional dependencies
   */
  protected registerPropertyConfig(
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
   * @param config - Configuration object with keys matching instance properties
   * @returns The number of attributes that were successfully set
   */
  protected loadSimpleConfig(config: Record<string, any>): Set<string> {
    if (!config || typeof config !== "object") {
      return new Set<string>();
    }

    let attributesSet: Set<string> = new Set<string>();

    for (const [key, value] of Object.entries(config)) {
      // Skip functions and non-existing properties
      if (!(key in this) || typeof this[key as keyof this] === "function") {
        continue;
      }

      // Apply transformation if configured
      if (key in this.propertyConfigs) {
        // Skip properties w/ dependencies
        if (this.propertyConfigs[key].dependencies) continue;

        // @ts-ignore - We've already checked the property exists
        this[key] = this.propertyConfigs[key].fromConfig(value);
      } else {
        // Direct assignment for properties without transformations
        // @ts-ignore - We've already checked the property exists
        this[key] = value;
      }

      attributesSet.add(key);
    }

    return attributesSet;
  }

  /**
   * Two-phase configuration loading: first initialize all properties, then apply transformations
   */
  protected loadComplexConfig(config: Record<string, any>): number {
    if (!config || typeof config !== "object") {
      return 0;
    }

    // // Phase 1: Direct property assignment without transformations
    for (const [key, value] of Object.entries(config)) {
      if (key in this && typeof this[key as keyof this] !== "function") {
        // @ts-ignore - We've already checked the property exists
        this[key] = value;
      }
    }

    // Phase 2: Apply registered transformations in order of dependencies
    this.applyTransformations(config);

    return Object.keys(config).length;
  }

  /**
   * Apply transformations to properties based on their dependencies
   */
  protected applyTransformations(config: Record<string, any>): void {
    const processed = new Set<string>();
    const context = { ...config };

    // Get all properties with transformations
    const propsToProcess = Object.keys(this.propertyConfigs);

    // Process properties in dependency order
    while (propsToProcess.length > 0) {
      let progress = false;

      for (let i = 0; i < propsToProcess.length; i++) {
        const prop = propsToProcess[i];
        const { dependencies = [] } = this.propertyConfigs[prop];

        // Check if all dependencies are processed
        if (
          dependencies.every(
            (dep) => processed.has(dep) || !(dep in this.propertyConfigs),
          )
        ) {
          // Update context with current property value
          context[prop] = this[prop as keyof this];

          // Apply transformation if property has one
          if (prop in this.propertyConfigs) {
            // @ts-ignore
            this[prop] = this.propertyConfigs[prop].fromConfig(
              this[prop as keyof this],
              context,
            );
          }

          // Mark as processed and remove from the list
          processed.add(prop);
          propsToProcess.splice(i, 1);
          i--;
          progress = true;
        }
      }

      // Break if no progress is made (circular dependency)
      if (!progress && propsToProcess.length > 0) {
        console.warn("Cannot resolve transformations for:", propsToProcess);
        break;
      }
    }
  }

  /**
   * Creates a derived property configuration that depends on other properties
   */
  protected createDerivedProperty(
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

  activate(game: GameBase): void {
    this.status = ModifierStatus.ACTIVE;
    this.onActivation(game);
  }

  playerActivate(game: GameBase, args: { playerId: number }): void {
    this.playerId = args.playerId;
    this.activate(game);
  }

  deactivate(game: GameBase): void {
    this.status = ModifierStatus.INACTIVE;
    this.onDeactivation(game);
  }

  pause(game: GameBase): void {
    if (this.status !== ModifierStatus.ACTIVE) return;
    this.status = ModifierStatus.PAUSED;
    this.onPausing(game);
  }

  resume(game: GameBase): void {
    if (this.status !== ModifierStatus.PAUSED) return;
    this.onResuming(game);
  }

  // Triggered events
  onUpdate(game: GameBase): void {}

  onActivation(game: GameBase): void {}
  onDeactivation(game: GameBase): void {}
  onPausing(game: GameBase): void {}
  onResuming(game: GameBase): void {}

  onGameStart(game: GameBase): void {}

  onUserInput(game: GameBase): void {}

  onPowerUpSpawn(game: GameBase): void {}
  onFailedPowerUpSpawn(game: GameBase, args: { reason: string }): void {}
  onPowerUpPickup(game: GameBase): void {}

  onCDFComputation(game: GameBase): void {}

  // Getters & Setters
  getName(): string {
    return this.name;
  }

  getStatus(): ModifierStatus {
    return this.status;
  }

  setStatus(status: ModifierStatus): void {
    this.status = status;
  }

  getActivationMode(): ModifierActivationMode {
    return this.activationMode;
  }
}
