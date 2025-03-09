import { Ball } from "../../types/games/pong/ball";
import { GameBase } from "./gameBase";
import { GAME_REGISTRY } from "../../types/games/gameRegistry";
import { ModifierBase, ModifierStatus } from "./modifierBase";

interface PowerUpProperties {
  radius: number;
  capacities: Record<string, number>;
}

export class ModifierManager {
  // Arrays that maintain the allowed names and their definitions.
  protected game: GameBase;

  // PowerUp related properties
  protected availablePowerUps: string[] = [];
  protected unavailablePowerUps: string[] = []; // List of power-up names that are unavailable

  protected powerUpCounters: Record<string, number> = {};
  protected powerUpDefaultProperties: PowerUpProperties = {
    radius: 10,
    capacities: {},
  };

  protected probabilityDensityFunction: number[] = [];
  protected cumulativeDensityFunction: number[] = [];

  protected spawnedPowerUps: Array<[string, Ball]> = new Array<
    [string, Ball]
  >();
  protected modifiers: ModifierBase[] = []; // Active modifiers

  constructor(game: GameBase) {
    this.game = game;

    // Initialize modifiers from registry
    this.initializeModifiers();

    // Initialize power-ups
    this.initializePowerUps();
  }

  protected initializeModifiers(): void {
    // Get the gameModifiers object from the registry
    const modifierRegistry =
      GAME_REGISTRY[this.game.gameData.gameName]?.gameModifiers;

    // Check if modifierRegistry exists
    if (modifierRegistry) {
      // Iterate over each key in the gameModifiers object
      Object.keys(modifierRegistry).forEach((modifierName) => {
        if (this.game.gameData.modifierNames.includes(modifierName)) {
          const modifier = modifierRegistry[modifierName];
          if (modifier && modifier.class) {
            // Create an instance of the modifier class
            const ModifierClass = modifier.class;
            this.modifiers.push(new ModifierClass());
          }
        }
      });
    }

    this.modifiers.forEach((modifier) => {
      modifier.activate(this.game);
      // modifier.setStatus(ModifierStatus.ACTIVE);
      console.log(modifier);
    });
  }

  protected initializePowerUps(): void {
    // Get the power ups object from the registry with proper type safety
    const gameMode =
      GAME_REGISTRY[this.game.gameData.gameName]?.gameModes[
        this.game.gameData.gameModeName
      ];

    if (!gameMode) {
      console.error(
        `Game mode ${this.game.gameData.gameModeName} not found for game ${this.game.gameData.gameName}`,
      );
      return;
    }

    // Make sure the default settings exist
    if (gameMode.defaultPowerUpSettings) {
      this.powerUpDefaultProperties = gameMode.defaultPowerUpSettings;
    } else {
      console.warn(
        `No default power up settings found for ${this.game.gameData.gameModeName}`,
      );
    }

    // Changed to properly iterate over the capacities object
    Object.entries(this.powerUpDefaultProperties.capacities).forEach(
      ([name, capacity]) => {
        console.log(`  |- ${name}: ${capacity}`);
      },
    );
    console.log("\n");

    // Extract available powerUpNames from the capacities object
    // (fixed from using Object.keys on the entire powerUpDefaultProperties)
    Object.keys(this.powerUpDefaultProperties.capacities).forEach((name) => {
      if (this.game.gameData.powerUpNames.includes(name))
        this.availablePowerUps.push(name);
      this.powerUpCounters[name] = 0;
    });

    this.computeCDF();
  }

  protected computeCDF(): void {
    // Build PDF by iterating over allowed names (in order) and skipping any that are unavailable
    const registryPowerUps =
      GAME_REGISTRY[this.game.gameData.gameName]?.powerUps;

    if (!registryPowerUps) {
      console.error(`Game ${this.game.gameData.gameName}.powerUps not found`);
      return;
    }

    const pdfArray: number[] = this.availablePowerUps
      .filter((name) => !this.unavailablePowerUps.includes(name))
      .map((name) => registryPowerUps[name].spawnWeight);

    // Compute total density
    const totalDensity = pdfArray.reduce((acc, val) => acc + val, 0);
    if (totalDensity === 0) {
      this.cumulativeDensityFunction = [];
      this.trigger("onCDFComputation");
      return;
    }

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

    this.trigger("onCDFComputation");
  }

  trigger(method: string, args: Record<string, any> = {}): void {
    // Helper function to safely invoke a method on an object
    const safeInvoke = (obj: any, methodName: string) => {
      try {
        // Check if the method exists and is a function
        if (typeof obj[methodName] === "function") {
          // Invoke the method with the current game instance and any additional arguments
          obj[methodName](this.game, args);
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
    for (const modifier of this.modifiers)
      if (modifier.getStatus() !== ModifierStatus.INACTIVE)
        safeInvoke(modifier, method);
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
      if (rnd < this.cumulativeDensityFunction[i])
        return Object.keys(this.powerUpDefaultProperties.capacities)[i];

    // Fallback: return a random allowed power-up
    const index = Math.floor(
      rng.random() *
        Object.keys(this.powerUpDefaultProperties.capacities).length,
    );
    return Object.keys(this.powerUpDefaultProperties.capacities)[index];
  }

  spawnRandomPowerUp(
    rng: { random: () => number },
    position: [number, number],
  ): boolean {
    const powerUpName: string | null = this.sampleRandomPowerUp(rng);
    console.log(`  |- sampled powerUp: ${powerUpName}`);
    if (!powerUpName) {
      console.log("Can't spawn any power up");
      this.trigger("onFailedPowerUpSpawn", {
        reason: "NONE_AVAILABLE",
      });
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
        radius: this.powerUpDefaultProperties.radius,
        isVisible: true,
        doCollision: true,
        doGoal: false,
      } as Ball,
    ]);

    console.log(`Successfully spawned @ [${position[0]}, ${position[1]}]`);

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
      GAME_REGISTRY[this.game.gameData.gameName].powerUps[powerUpName].class;

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
      this.powerUpCounters[powerUpName] <
        (this.powerUpDefaultProperties.capacities[powerUpName] || -1)
    ) {
      // Remove the name from unavailablePowerUps
      const i = this.unavailablePowerUps.indexOf(powerUpName);
      if (i >= 0) this.unavailablePowerUps.splice(i, 1);

      this.computeCDF();
    }

    // becomes unavailable
    if (
      !this.unavailablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] >=
        (this.powerUpDefaultProperties.capacities[powerUpName] || -1)
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

  getCDF(): number[] {
    return this.cumulativeDensityFunction;
  }
}
