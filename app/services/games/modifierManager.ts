import type { Ball } from "../../types/games/pong/ball";
import type { GameBase } from "./gameBase";
import { GAME_REGISTRY } from "../../types/games/gameRegistry";
import {
  ModifierActivationMode,
  type ModifierBase,
  ModifierStatus,
} from "./modifierBase";
import { IRNG } from "../../types/games/rng";

export class ModifierManager {
  // Arrays that maintain the allowed names and their definitions.
  protected game: GameBase;

  // PowerUp related properties
  protected availablePowerUps: string[] = [];
  protected unavailablePowerUps: string[] = []; // List of power-up names that are unavailable

  protected powerUpCounters: Record<string, number> = {};

  protected probabilityDensityFunction: number[] = [];
  protected cumulativeDensityFunction: number[] = [];

  protected spawnedPowerUps: Array<[string, Ball]> = new Array<
    [string, Ball]
  >();
  protected modifiers: ModifierBase[] = []; // Active modifiers

  constructor(game: GameBase) {
    this.game = game;
  }

  initializeModifiers(): void {
    // Get the gameModifiers object from the registry
    const modifierRegistry =
      GAME_REGISTRY[this.game.gameData.gameName]?.gameModifiers;

    // Check if modifierRegistry exists
    if (modifierRegistry) {
      // Iterate over each key in the gameModifiers object
      Object.keys(modifierRegistry).forEach((modifierName) => {
        if (
          Object.keys(this.game.gameData.modifierNames).includes(modifierName)
        ) {
          const modifier = modifierRegistry[modifierName];
          if (modifier && modifier.class) {
            // Create an instance of the modifier classs
            const ModifierClass = modifier.class;
            this.modifiers.push(
              new ModifierClass(
                this.game.gameData.modifierNames[modifierName] || {},
              ),
            );
          }
        }
      });
    }

    this.modifiers.forEach((modifier) => {
      modifier.activate(this.game);
    });
  }

  initializePowerUps(): void {
    const gameSettings = this.game.getSettings();

    // Extract available powerUpNames from the capacities object

    Object.keys(this.game.gameData.powerUpNames)
      .filter((name) =>
        Object.keys(gameSettings.powerUpCapacities).includes(name),
      )
      .forEach((name) => {
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
        console.log("Object details:", {
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
    const state = {
      spawnedPowerUps: this.spawnedPowerUps,
      modifiersState: {
        ...Object.fromEntries(
          this.modifiers.map((modifiers) => [
            modifiers.name,
            modifiers.getState(),
          ]),
        ),
      },
    };

    return state;
  }

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.spawnedPowerUps = snapshot.spawnedPowerUps || [];
  }

  sampleRandomPowerUp(rng: IRNG): string | null {
    if (this.cumulativeDensityFunction.length <= 0) return null;

    const rnd = rng.random();
    // Loop over the CDF and return the first power-up whose cumulative value exceeds rnd
    for (let i = 0; i < this.cumulativeDensityFunction.length; i++)
      if (rnd < this.cumulativeDensityFunction[i])
        return this.availablePowerUps.filter(
          (name) => !this.unavailablePowerUps.includes(name),
        )[i];

    return null;
  }

  spawnRandomPowerUp(rng: IRNG, position: { x: number; y: number }): boolean {
    const powerUpName: string | null = this.sampleRandomPowerUp(rng);
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
        x: position.x,
        y: position.y,
        dx: 0.0,
        dy: 0.0,
        speed: 0.0,
        radius: this.game.getSettings().powerUpRadius,
        isVisible: true,
        doCollision: true,
        doGoal: false,
      } as Ball,
    ]);

    this.trigger("onPowerUpSpawn");

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

  pickupPowerUp(objectId: number): void {
    const powerUp: [string, Ball] = this.spawnedPowerUps[objectId];

    this.spawnedPowerUps.splice(objectId, 1);
    this.createPowerUpInstance(powerUp[0]);

    this.trigger("onPowerUpPickup");
  }

  protected createPowerUpInstance(powerUpName: string): void {
    const powerUpClass =
      GAME_REGISTRY[this.game.gameData.gameName].powerUps[powerUpName].class;

    if (!powerUpClass) {
      console.log(`Unknown powerUpClass: ${powerUpName}`);
      return;
    }

    const powerUp: ModifierBase = new powerUpClass(
      this.game.gameData.powerUpNames[powerUpName] || {},
    ) as ModifierBase;
    if (powerUp.getActivationMode() === ModifierActivationMode.AUTO)
      powerUp.activate(this.game);
    this.modifiers.push(powerUp);
  }

  updateAvailability(powerUpName: string): void {
    // becomes available
    if (
      this.unavailablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] <
        (this.game.getSettings().powerUpCapacities[powerUpName] || -1)
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
        (this.game.getSettings().powerUpCapacities[powerUpName] || -1)
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
  getSpawnedPowerUps(): Array<[string, Ball]> {
    return this.spawnedPowerUps;
  }

  getSpawnedPowerUsObjects(): Ball[] {
    return this.spawnedPowerUps.map((value) => value[1]);
  }

  getModifiers(): ModifierBase[] {
    return this.modifiers;
  }

  getCDF(): number[] {
    return this.cumulativeDensityFunction;
  }
}
