import { Ball } from "../../types/games/pong/ball";
import { GAME_REGISTRY } from "./gameRegistry";
import { ModifierBase, ModifierStatus } from "./modifierBase";

export class ModifierManager {
  // Arrays that maintain the allowed names and their definitions.
  protected rawGameData: Record<string, any>;

  // PowerUp related properties
  protected powerUpNames: string[] = []; // List of power-up names
  protected availablePowerUps: any[] = []; // From the registry (in same order as powerUpNames)
  protected unavailablePowerUps: string[] = []; // List of power-up names that are unavailable

  protected powerUpCounters: Record<string, number> = {};
  protected powerUpDefaultProperties: Record<string, any> = {};
  protected powerUpCapacities: Record<string, number> = {};

  protected probabilityDensityFunction: number[] = [];
  protected cumulativeDensityFunction: number[] = [];

  protected spawnedPowerUps: Array<[string, Ball]> = new Array<
    [string, Ball]
  >();
  protected modifiers: ModifierBase[] = []; // Active modifiers

  constructor(gameData: Record<string, any>) {
    this.rawGameData = gameData;

    // Initialize modifiers from registry
    this.initializeModifiers();

    // Initialize power-ups
    this.initializePowerUps();
  }

  protected initializeModifiers(): void {
    // Get modifiers from the registry
    const modifierRegistry: Record<string, any> =
      GAME_REGISTRY[this.rawGameData.gameName]?.modifiers;

    // Check if modifierRegistry exists and has an array property
    if (
      modifierRegistry &&
      modifierRegistry.array &&
      Array.isArray(modifierRegistry.array)
    ) {
      modifierRegistry.array.forEach((modifier) => {
        if (modifier.class) {
          // Use the concrete class directly without casting to ModifierBase
          const ModifierClass = modifier.class;
          this.modifiers.push(new ModifierClass());
        }
      });
    }
  }

  protected initializePowerUps(): void {
    // Get the power ups object from the registry
    const registryPowerUps = GAME_REGISTRY[this.rawGameData.gameName]?.powerUps;
    if (!registryPowerUps) {
      console.warn(
        `No power ups defined for game "${this.rawGameData.gameName}"`,
      );
      return;
    }

    // Create availablePowerUps in the same order as allowed names
    this.availablePowerUps = this.powerUpNames.map(
      (name) => registryPowerUps[name],
    );

    // Initialize counters
    this.powerUpNames.forEach((name) => {
      this.powerUpCounters[name] = 0;
    });

    // Read properties from the registry
    this.powerUpDefaultProperties =
      GAME_REGISTRY[this.rawGameData.gameName]["game_modes"][
        this.rawGameData.gameModeName
      ]?.["defaultPowerUpSettings"] || {};

    // Extract capacities
    this.powerUpCapacities =
      this.powerUpDefaultProperties["powerUpsCapacities"] || {};

    this.computeCDF();
  }

  protected computeCDF(): void {
    // Build PDF by iterating over allowed names (in order) and skipping any that are unavailable
    const pdfArray = this.powerUpNames
      .filter((name) => !this.unavailablePowerUps.includes(name))
      .map((name) => {
        // Find the index in the powerUpNames list
        const index = this.powerUpNames.indexOf(name);
        // Assume that the registry object has a property "spawnWeight"
        return Number(this.availablePowerUps[index]?.spawnWeight) || 0;
      });

    // Compute total density
    const totalDensity = pdfArray.reduce((acc, val) => acc + val, 0);
    if (totalDensity === 0) return;

    // Normalize the PDF
    this.probabilityDensityFunction = pdfArray.map((val) => val / totalDensity);

    // Compute the cumulative density function
    let cumul = 0;
    this.cumulativeDensityFunction = this.probabilityDensityFunction.map(
      (val) => {
        cumul += val;
        return cumul;
      },
    );
  }

  trigger(method: string, ...args: any[]): void {
    // Helper function to safely invoke a method on an object
    const safeInvoke = (obj: any, methodName: string) => {
      try {
        // Check if the method exists and is a function
        if (typeof obj[methodName] === "function") {
          // Invoke the method with the current game instance and any additional arguments
          obj[methodName](this, ...args);
        }
      } catch (error) {
        console.error(
          `Error triggering method ${methodName} on object:`,
          error,
        );
        console.log(`Object details:`, {
          objectType: obj.constructor.name,
          availableMethods: Object.getOwnPropertyNames(
            Object.getPrototypeOf(obj),
          ).filter((prop) => typeof obj[prop] === "function"),
        });
      }
    };

    // Trigger method on all modifiers
    for (const modifier of this.modifiers) {
      if (modifier.getStatus() === ModifierStatus.ACTIVE)
        safeInvoke(modifier, method);
    }
  }

  getStateSnapshot(): Record<string, any> {
    return {
      spawnedPowerUps: this.spawnedPowerUps,
      // modifiers: this.modifiers.map(modifier => modifier.getState()),
      // activePowerUps: this.activePowerUps.map(powerUp => powerUp.getState())
    };
  }

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.spawnedPowerUps = snapshot["spawnedPowerUps"] || [];

    // For a complete implementation, you would need to reconstruct the modifier
    // and powerUp instances from their states, but that requires additional knowledge
    // about the ModifierBase class implementation
  }

  sampleRandomPowerUp(rng: { random: () => number }): string | null {
    if (this.cumulativeDensityFunction.length <= 0) return null;

    const rnd = rng.random();
    // Loop over the CDF and return the first power-up whose cumulative value exceeds rnd
    for (let i = 0; i < this.cumulativeDensityFunction.length; i++)
      if (rnd < this.cumulativeDensityFunction[i]) return this.powerUpNames[i];

    // Fallback: return a random allowed power-up
    const index = Math.floor(rng.random() * this.powerUpNames.length);
    return this.powerUpNames[index];
  }

  spawnRandomPowerUp(
    rng: { random: () => number },
    position: [number, number],
  ): boolean {
    const powerUpName: string | null = this.sampleRandomPowerUp(rng);
    if (!powerUpName) {
      console.log("Can't spawn any power up");
      return false;
    }

    // Update counter & availability
    this.powerUpCounters[powerUpName]++;
    this.updateAvailability(powerUpName);

    // Spawn the power-up: push its data into spawnedPowerUps
    this.spawnedPowerUps.push([
      powerUpName,
      {
        x: position[0],
        y: position[1],
        dx: 0.0,
        dy: 0.0,
        speed: 0.0,
        radius: this.powerUpDefaultProperties["size"],
        isVisible: true,
        doCollision: true,
        doGoal: false,
      } as Ball,
    ]);

    return true;
  }

  // Handle power-up deletion
  deletePowerUp(powerUp: ModifierBase): void {
    const powerUpName: string = powerUp.getName();
    const index = this.modifiers.indexOf(powerUp);
    if (index >= 0) this.modifiers.splice(index, 1);

    this.powerUpCounters[powerUpName]--;
    this.updateAvailability(powerUpName);
  }

  pickupPowerUp(powerUp: Ball): void {
    let obj: string | null = null;
    for (const [type, ball] of this.spawnedPowerUps) {
      if (ball === powerUp) {
        obj = type;
        this.spawnedPowerUps.splice(this.spawnedPowerUps.indexOf([type, ball]));
        break;
      }
    }

    if (!obj) {
      console.log(`Unknown powerUp picked up: ${powerUp}`);
      return;
    }

    this.createPowerUpInstance(obj as string);
  }

  protected createPowerUpInstance(powerUpName: string): void {
    const powerUpClass =
      GAME_REGISTRY[this.rawGameData.gameName].powerUps[powerUpName].class;

    if (!powerUpClass) {
      console.log(`Unknown powerUpClass: ${powerUpName}`);
      return;
    }

    this.modifiers.push(new powerUpClass());
  }

  updateAvailability(powerUpName: string): void {
    // becomes available
    if (
      this.unavailablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] < this.powerUpCapacities[powerUpName]
    ) {
      // Remove the name from unavailablePowerUps
      const i = this.unavailablePowerUps.indexOf(powerUpName);
      if (i >= 0) this.unavailablePowerUps.splice(i, 1);

      this.computeCDF();
    }

    // becomes unavailable
    if (
      !this.unavailablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] >= this.powerUpCapacities[powerUpName]
    ) {
      // Add the name to unavailablePowerUps
      this.unavailablePowerUps.push(powerUpName);
      this.computeCDF();
    }
  }

  // Modifiers management methods
  addModifier(modifier: ModifierBase): void {
    this.modifiers.push(modifier);
  }

  removeModifier(modifier: ModifierBase): void {
    const index = this.modifiers.indexOf(modifier);
    if (index >= 0) this.modifiers.splice(index, 1);
  }

  // Getters & Setters
  getSpawnedPowerUps(): Record<string, any>[] {
    return this.spawnedPowerUps;
  }

  getmodifiers(): ModifierBase[] {
    return this.modifiers;
  }
}
