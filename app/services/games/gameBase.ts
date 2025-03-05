import { PowerUpManagerBase } from "./powerUpManagerBase";
import { ModifierBase } from "./modifierBase";
import { GAME_REGISTRY } from "./gameRegistry";

export enum GameState {
  CREATED,
  RUNNING,
  FINISHED,
}

export abstract class GameBase {
  protected matchId: string;

  protected lastUpdateTime: number;
  protected startTimeMs: number;

  protected state: GameState = GameState.CREATED;
  protected tickData: Record<string, any>[];

  protected modifiers: ModifierBase[];
  protected powerUpManager: PowerUpManagerBase;

  constructor(public gameData: Record<string, any>) {
    this.matchId = gameData["matchId"];
    this.lastUpdateTime = Date.now();
    this.startTimeMs = Date.now();

    this.modifiers = (gameData["modifierNames"] as string[]).map(
      (modifierName) =>
        GAME_REGISTRY[gameData["gameName"]]["game_modifiers"][modifierName][
          "class"
        ](),
    );

    this.tickData = [];
    this.powerUpManager = new PowerUpManagerBase(gameData);
  }

  /**
   * Advances the game by 1 tick.
   */
  abstract update(): Promise<void>;

  /**
   * Starts the game.
   */
  startGame(): void {
    this.state = GameState.RUNNING;
    console.log("Game started");
    this.triggerModifiers("on_game_start");
  }

  /**
   * Rewinds the game state to a specific tick.
   */
  async rewind(toTick: number): Promise<void> {
    // Implementation here...
  }

  /**
   * Fast-forwards the game state by replaying tickCount ticks.
   */
  async fastForward(tickCount: number): Promise<void> {
    // Implementation here...
  }

  /**
   * Returns a snapshot of the current game state.
   */
  getStateSnapshot(): Record<string, any> {
    return {
      type: "game_state",
      timestamp: this.lastUpdateTime,
    };
  }

  /**
   * Restores a game state snapshot.
   */
  abstract loadStateSnapshot(snapshot: Record<string, any>): void;

  /**
   * Handles a client action.
   */
  async handleAction(action: Record<string, any>): Promise<void> {
    // Implementation here...
  }

  /**
   * Spawns a power-up at the designated position.
   * @param position A tuple with the x and y coordinates.
   * @param rng A random number generator instance.
   */
  spawnPowerUp(
    position: [number, number],
    rng: { random: () => number },
  ): void {
    if (
      this.powerUpManager &&
      this.powerUpManager.spawnRandomPowerUp(rng, position)
    ) {
      const spawned = this.powerUpManager.getSpawnedPowerUps();
      const lastPowerUp = spawned[spawned.length - 1];
      this.triggerModifiers("onPowerUpSpawn", { powerUp: lastPowerUp });
    }
  }

  /**
   * Triggers a method on both game modifiers and active power-ups.
   * @param method The method name to trigger.
   * @param args Extra arguments to pass along.
   */
  triggerModifiers(method: string, ...args: any[]): void {
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
      safeInvoke(modifier, method);
    }

    // Trigger method on all active power-ups
    for (const powerUp of this.powerUpManager.getActivePowerUps()) {
      safeInvoke(powerUp, method);
    }
  }

  // Getters & Setters
  getState(): GameState {
    return this.state;
  }
}
