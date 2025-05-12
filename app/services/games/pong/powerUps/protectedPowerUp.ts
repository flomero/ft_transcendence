import { ModifierBase } from "../../modifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Rectangle } from "../../../../types/games/pong/rectangle";
import { Pong } from "../pong";
import { Ball } from "../../../../types/games/pong/ball";

export class ProtectedPowerUp extends ModifierBase {
  name = "protectedPowerUp";

  protected powerUpName: string = "";
  protected powerUpRadiusWidthFactor: number = 0;
  protected wellRadiusWidthFactor: number = 0;
  protected speedMultiplier: number = 0;

  walls: Rectangle[] = [];

  protected meanSpawnRadiusHeightFactor: number = 0;
  protected stdDevSpawnRadiusHeightFactor: number = 0;

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.powerUps[this.name];

    this.configManager.registerPropertyConfig(
      "spawnWeight",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "duration",
      (_, context) => {
        const durationS = context.duration || defaultRegistry.durationS;
        return durationS * serverTickrateS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "activationMode",
      (_, context) => {
        const selfActivation =
          context.activationMode || defaultRegistry.selfActivation
            ? ModifierActivationMode.SELF
            : ModifierActivationMode.AUTO;
        return selfActivation;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "powerUpName",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "powerUpRadiusWidthFactor",
      (_, context) => {
        const powerUpRadiusWidthPercent =
          context.powerUpRadiusWidthFactor ||
          defaultRegistry.powerUpRadiusWidthPercent;
        return powerUpRadiusWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "wellRadiusWidthFactor",
      (_, context) => {
        const wellRadiusWidthPercent =
          context.wellRadiusWidthFactor ||
          defaultRegistry.wellRadiusWidthPercent;
        return wellRadiusWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "speedMultiplier",
      (_, context) => {
        const speedMultiplierPercent =
          context.speedMultiplier || defaultRegistry.speedMultiplierPercent;
        return speedMultiplierPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "meanSpawnRadiusHeightFactor",
      (_, context) => {
        const meanSpawnRadiusHeightPercent =
          context.meanSpawnRadiusHeightFactor ||
          defaultRegistry.meanSpawnRadiusHeightPercent;
        return meanSpawnRadiusHeightPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "stdDevSpawnRadiusHeightFactor",
      (_, context) => {
        const stdDevSpawnRadiusHeightPercent =
          context.stdDevSpawnRadiusHeightFactor ||
          defaultRegistry.stdDevSpawnRadiusHeightPercent;
        return stdDevSpawnRadiusHeightPercent / 100.0;
      },
      undefined,
    );

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);
  }

  onActivation(game: Pong): void {
    this.createWalls(game);
  }

  protected createWalls(game: Pong) {
    const gameSettings = game.getSettings();
    const gameState = game.getState();

    // 0. Sample the position
    const innerRadius =
      (this.powerUpRadiusWidthFactor * gameSettings.arenaWidth) / 2.0;
    const outerRadius =
      (this.wellRadiusWidthFactor * gameSettings.arenaWidth) / 2.0;
    const minRadius = 2.0 * outerRadius;

    const deltaRadius = gameSettings.arenaHeight / 2.0 - minRadius;
    let rndDist = game
      .getRNG()
      .randomGaussian(
        this.meanSpawnRadiusHeightFactor * deltaRadius,
        this.stdDevSpawnRadiusHeightFactor * deltaRadius,
      );
    rndDist = minRadius + Math.min(deltaRadius, Math.max(rndDist, 0.0));

    const rndAngle = game.getRNG().random() * 2.0 * Math.PI;

    const centerPos = {
      x: gameSettings.arenaWidth / 2.0 + rndDist * Math.cos(rndAngle),
      y: gameSettings.arenaHeight / 2.0 + rndDist * Math.sin(rndAngle),
    };

    // 1.0 Create the walls
    const wallCount = Math.max(5, gameState.playerCount);
    const wallWidth = 2.0 * outerRadius * Math.sin(Math.PI / wallCount);
    const wallHeight = gameSettings.paddleHeight / 2.0;

    Array.from<number>({ length: wallCount }).forEach((_, index) => {
      const wall: Rectangle = {
        id: gameState.walls.length + index,
        x: parseFloat(
          (outerRadius * Math.cos((2.0 * Math.PI * index) / wallCount)).toFixed(
            3,
          ),
        ),
        y: parseFloat(
          (outerRadius * Math.sin((2.0 * Math.PI * index) / wallCount)).toFixed(
            3,
          ),
        ),
        alpha: parseFloat(((2.0 * Math.PI * index) / wallCount).toFixed(3)),
        width: wallWidth,
        height: wallHeight,
        isVisible: true,
        absX: 0,
        absY: 0,
        nx: 0,
        ny: 0,
        dx: 0,
        dy: 0,
        isGoal: false,
        doCollision: true,
        doRotation: true,
        doBoundsProtection: true,
        doResolveCollision: true,
      };

      const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

      if (tmp !== 0) {
        wall.nx = -wall.x / tmp;
        wall.ny = -wall.y / tmp;
      }

      wall.absX = wall.x;
      wall.absY = wall.y;
      wall.x += centerPos.x;
      wall.y += centerPos.y;

      wall.dx = wall.ny;
      wall.dy = -wall.nx;

      this.walls.push(wall);
    });

    // 2. Create the powerUp
    const powerUp: Ball = {
      id: game.getModifierManager().getSpawnedPowerUps().length,
      x: centerPos.x,
      y: centerPos.y,
      radius: innerRadius,
      speed: 0.0,
      isVisible: true,
      doCollision: true,
      doGoal: false,
      dx: 0.0,
      dy: 0.0,
    };

    game
      .getModifierManager()
      .getSpawnedPowerUps()
      .push([this.powerUpName, powerUp]);

    gameState.walls.push(...this.walls);
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }): void {
    if (args.ballID > 0) return;

    const gameState = game.getState();
    const hitWall = gameState.walls[args.wallID];

    const wallIndex = this.walls.indexOf(hitWall);
    if (wallIndex === -1) return;

    this.walls.splice(wallIndex, 1);
    gameState.walls.splice(args.wallID, 1);

    gameState.balls[args.ballID].speed +=
      gameState.balls[args.ballID].speed * this.speedMultiplier;
  }
}
