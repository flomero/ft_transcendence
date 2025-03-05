import { GAME_REGISTRY } from "./gameRegistry";
import { ModifierBase } from "./modifierBase";

export class PowerUpManagerBase {
  // Arrays that maintain the allowed names and their definitions.
  protected powerUpNames: string[] = [];
  protected availablePowerUps: any[] = []; // From the registry (in same order as powerUpNames)
  protected unavailablePowerUps: string[] = []; // List of power-up names that are unavailable

  protected powerUpCounters: Record<string, number> = {};
  protected powerUpDefaultProperties: Record<string, any> = {};
  protected powerUpCapacities: Record<string, number> = {};

  protected probabilityDensityFunction: number[] = [];
  protected cumulativeDensityFunction: number[] = [];

  protected spawnedPowerUps: Record<string, any>[] = [];
  protected activePowerUps: ModifierBase[] = [];

  constructor(gameData: Record<string, any>) {
    // Save allowed power-up names in order.
    const gameName: string = gameData["gameName"];
    const gameModeName: string = gameData["gameModeName"];
    this.powerUpNames = gameData["powerUpNames"];

    // Get the power ups object from the registry.
    const registryPowerUps = GAME_REGISTRY[gameName]["power_ups"];
    if (!registryPowerUps)
      throw new Error(`No power ups defined for game "${gameName}"`);

    // Create availablePowerUps in the same order as allowed names.
    this.availablePowerUps = this.powerUpNames.map(
      (name) => registryPowerUps[name],
    );

    // Initialize counters.
    this.powerUpNames.forEach((name) => {
      this.powerUpCounters[name] = 0;
    });

    // Read properties from the registry.
    this.powerUpDefaultProperties =
      GAME_REGISTRY[gameName]["game_modes"][gameModeName][
        "defaultPowerUpSettings"
      ];

    // Extract capacities
    this.powerUpCapacities =
      this.powerUpDefaultProperties["powerUpsCapacities"];

    this.computeCDF();
  }

  protected computeCDF(): void {
    // Build PDF by iterating over allowed names (in order) and skipping any that are unavailable.
    const pdfArray = this.powerUpNames
      .filter((name) => !this.unavailablePowerUps.includes(name))
      .map((name) => {
        // Find the index in the powerUpNames list.
        const index = this.powerUpNames.indexOf(name);
        // Assume that the registry object has a property "spawnWeight"
        return Number(this.availablePowerUps[index].spawnWeight) || 0;
      });

    // Compute total density.
    const totalDensity = pdfArray.reduce((acc, val) => acc + val, 0);
    if (totalDensity === 0) return;

    // Normalize the PDF.
    this.probabilityDensityFunction = pdfArray.map((val) => val / totalDensity);

    // Compute the cumulative density function.
    let cumul = 0;
    this.cumulativeDensityFunction = this.probabilityDensityFunction.map(
      (val) => {
        cumul += val;
        return cumul;
      },
    );
  }

  getStateSnapshot(): Record<string, any> {
    return {
      spawnedPowerUps: this.spawnedPowerUps,
    };
  }

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.spawnedPowerUps = snapshot["spawnedPowerUps"];
  }

  sampleRandomPowerUp(rng: { random: () => number }): string | null {
    if (this.cumulativeDensityFunction.length <= 0) return null;

    const rnd = rng.random();
    // Loop over the CDF and return the first power-up whose cumulative value exceeds rnd.
    for (let i = 0; i < this.cumulativeDensityFunction.length; i++)
      if (rnd < this.cumulativeDensityFunction[i]) return this.powerUpNames[i];

    // Fallback: return a random allowed power-up.
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

    // Spawn the power-up: push its data into spawnedPowerUps.
    this.spawnedPowerUps.push({
      x: position[0],
      y: position[1],
      size: this.powerUpDefaultProperties["size"],
      type: powerUpName,
      visible: true,
    });

    return true;
  }

  // Generic implementations
  activatePowerUp(powerUp: ModifierBase): void {
    const index = this.activePowerUps.indexOf(powerUp);
    if (index >= 0) this.activePowerUps.push(powerUp);
  }

  deactivatePowerUp(powerUp: ModifierBase): void {
    const powerUpName: string = powerUp.getName();
    const index = this.activePowerUps.indexOf(powerUp);
    if (index >= 0) this.activePowerUps.splice(index, 1);

    this.powerUpCounters[powerUpName]--;
    this.updateAvailability(powerUpName);
  }

  updateAvailability(powerUpName: string): void {
    // becomes available
    if (
      this.unavailablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] < this.powerUpCapacities[powerUpName]
    ) {
      // Remove the name from unavailablePowerUps.
      const i = this.unavailablePowerUps.indexOf(powerUpName);
      if (i >= 0) this.unavailablePowerUps.splice(i, 1);

      this.computeCDF();
    }

    // becomes unavailable
    if (
      this.availablePowerUps.includes(powerUpName) &&
      this.powerUpCounters[powerUpName] >= this.powerUpCapacities[powerUpName]
    ) {
      // Add the name to unavailablePowerUps.

      this.unavailablePowerUps.push(powerUpName);
      this.computeCDF();
    }
  }

  // Getters & Setters
  getSpawnedPowerUps(): Record<string, any>[] {
    return this.spawnedPowerUps;
  }

  getActivePowerUps(): ModifierBase[] {
    return this.activePowerUps;
  }
}
