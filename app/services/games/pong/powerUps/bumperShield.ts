import { ModifierBase } from "../../modifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Rectangle } from "../../../../types/games/pong/rectangle";
import { Pong } from "../pong";

export class BumperShield extends ModifierBase {
  name = "bumperShield";

  protected wallTotalWidthArenaWidthFactor: number = 0;
  protected wallJunctionArenaWidthFactor: number = 0;
  protected wallGoalOffsetArenaWidthFactor: number = 0;
  protected speedMultiplier: number = 0;

  protected walls: Rectangle[] = [];

  protected wallsHitCount: number = 0;
  protected wallsHitThresold: number = 0;

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
      "wallsHitThresold",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "wallTotalWidthArenaWidthFactor",
      (_, context) => {
        const wallTotalWidthArenaWidthPercent =
          context.wallTotalWidthArenaWidthFactor ||
          defaultRegistry.wallTotalWidthArenaWidthPercent;
        return wallTotalWidthArenaWidthPercent / 100.0;
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
      "wallJunctionArenaWidthFactor",
      (_, context) => {
        const wallJunctionArenaWidthPercent =
          context.wallJunctionArenaWidthFactor ||
          defaultRegistry.wallJunctionArenaWidthPercent;
        return wallJunctionArenaWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "wallGoalOffsetArenaWidthFactor",
      (_, context) => {
        const wallGoalOffsetArenaWidthPercent =
          context.wallGoalOffsetArenaWidthFactor ||
          defaultRegistry.wallGoalOffsetArenaWidthPercent;
        return wallGoalOffsetArenaWidthPercent / 100.0;
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
    this.playerId = game.getState().lastHit;
    if (this.playerId === -1) {
      const players = Array.from<number>({
        length: game.getState().playerCount,
      })
        .map((_, index) => index)
        .filter((index) => !game.isEliminated(index));
      console.dir(players, { depth: null });
      const rndID = game.getRNG().randomInt(players.length - 1);
      this.playerId = players[rndID];
    }

    console.log(`pID: ${this.playerId}`);

    this.createWalls(game);
  }

  protected createWalls(game: Pong) {
    const gameSettings = game.getSettings();
    const gameState = game.getState();

    const paddle = gameState.paddles[this.playerId];
    const playerGoalWall = gameState.walls[2 * this.playerId];

    console.log(`Paddle:`);
    console.dir(paddle, { depth: null });
    console.log(`Wall:`);
    console.dir(playerGoalWall, { depth: null });

    console.log(`wallGoallOffset: ${this.wallGoalOffsetArenaWidthFactor}`);

    console.log(`gameSettings:`);
    console.dir(gameSettings, { depth: null });

    // 0. compute center positions
    const centerPos = {
      x:
        playerGoalWall.x +
        playerGoalWall.nx *
          ((this.wallGoalOffsetArenaWidthFactor * gameSettings.arenaWidth) /
            2.0 +
            playerGoalWall.height / 2.0),
      y:
        playerGoalWall.y +
        playerGoalWall.ny *
          ((this.wallGoalOffsetArenaWidthFactor * gameSettings.arenaWidth) /
            2.0 +
            playerGoalWall.height / 2.0),
    };

    console.log(`Center pos:`);
    console.dir(centerPos, { depth: null });

    const junctionPos = {
      x:
        centerPos.x +
        (paddle.nx *
          this.wallJunctionArenaWidthFactor *
          gameSettings.arenaWidth) /
          2.0,
      y:
        centerPos.y +
        (paddle.ny *
          this.wallJunctionArenaWidthFactor *
          gameSettings.arenaWidth) /
          2.0,
    };

    console.log(`Junction pos:`);
    console.dir(junctionPos, { depth: null });

    // 1. Compute wall endpoints
    // 1.1 Left wall
    const leftWallEndpoint = {
      x: centerPos.x + (playerGoalWall.dx * playerGoalWall.width) / 2.0,
      y: centerPos.y + (playerGoalWall.dy * playerGoalWall.width) / 2.0,
    };

    const leftWallDir = {
      x: junctionPos.x - leftWallEndpoint.x,
      y: junctionPos.y - leftWallEndpoint.y,
    };

    // 1.2 Right wall
    const rightWallEndpoint = {
      x: centerPos.x - (playerGoalWall.dx * playerGoalWall.width) / 2.0,
      y: centerPos.y - (playerGoalWall.dy * playerGoalWall.width) / 2.0,
    };

    const rightWallDir = {
      x: junctionPos.x - rightWallEndpoint.x,
      y: junctionPos.y - rightWallEndpoint.y,
    };

    console.log(`left & right wall endpoints:`);
    console.dir(leftWallEndpoint, { depth: null });
    console.dir(rightWallEndpoint, { depth: null });

    // 2. Compute the walls
    const totalPossibleWidth = Math.hypot(leftWallDir.x, leftWallDir.y) || 1;
    leftWallDir.x /= totalPossibleWidth;
    leftWallDir.y /= totalPossibleWidth;
    rightWallDir.x /= totalPossibleWidth;
    rightWallDir.y /= totalPossibleWidth;

    const leftWallAlpha = Math.atan2(leftWallDir.x, leftWallDir.y);
    const rightWallAlpha = Math.atan2(rightWallDir.x, rightWallDir.y);

    const wallWidth =
      (((this.wallTotalWidthArenaWidthFactor * gameSettings.arenaWidth) / 2.0) *
        (this.wallsHitThresold - this.wallsHitCount)) /
      this.wallsHitThresold;
    const wallHeight = gameSettings.paddleHeight / 2.0;

    const leftWall: Rectangle = {
      id: gameState.walls.length,
      x: leftWallEndpoint.x + (leftWallDir.x * wallWidth) / 2.0,
      y: leftWallEndpoint.y + (leftWallDir.y * wallWidth) / 2.0,
      alpha: leftWallAlpha,
      width: wallWidth,
      height: wallHeight,
      dx: leftWallDir.x,
      dy: leftWallDir.y,
      nx: -leftWallDir.y,
      ny: leftWallDir.x,
      absX: leftWallEndpoint.x + (leftWallDir.x * wallWidth) / 2.0,
      absY: leftWallEndpoint.y + (leftWallDir.y * wallWidth) / 2.0,
      isVisible: true,
      doCollision: true,
      doBoundsProtection: true,
      doResolveCollision: true,
      doRotation: true,
    };

    const rightWall: Rectangle = {
      id: gameState.walls.length,
      x: rightWallEndpoint.x + (rightWallDir.x * wallWidth) / 2.0,
      y: rightWallEndpoint.y + (rightWallDir.y * wallWidth) / 2.0,
      alpha: rightWallAlpha,
      width: wallWidth,
      height: wallHeight,
      dx: rightWallDir.x,
      dy: rightWallDir.y,
      nx: -rightWallDir.y,
      ny: rightWallDir.x,
      absX: rightWallEndpoint.x + (rightWallDir.x * wallWidth) / 2.0,
      absY: rightWallEndpoint.y + (rightWallDir.y * wallWidth) / 2.0,
      isVisible: true,
      doCollision: true,
      doBoundsProtection: true,
      doResolveCollision: true,
      doRotation: true,
    };

    console.log(`Walls:`);
    console.dir(leftWall, { depth: null });
    console.dir(rightWall, { depth: null });

    // 3. Add to arrays
    this.walls.push(...[leftWall, rightWall]);
    gameState.walls.push(...this.walls);
  }

  protected clearWalls(game: Pong) {
    this.walls.forEach((wall) => {
      const wallID = game.getState().walls.indexOf(wall);
      if (wallID < 0) return;
      game.getState().walls.splice(wallID, 1);
    });
    this.walls = [];
  }

  onDeactivation(game: Pong): void {
    this.clearWalls(game);
    game.getModifierManager().deletePowerUp(this);
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }): void {
    if (args.ballID > 0) return;

    const gameState = game.getState();
    const hitWall = gameState.walls[args.wallID];

    const wallIndex = this.walls.indexOf(hitWall);
    if (wallIndex === -1) return;

    gameState.balls[args.ballID].speed +=
      gameState.balls[args.ballID].speed * this.speedMultiplier;
    if (++this.wallsHitCount >= this.wallsHitThresold) this.deactivate(game);
    else {
      this.clearWalls(game);
      this.createWalls(game);
    }
  }

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    if (args.playerId === this.playerId) this.deactivate(game);
  }

  onArenaModification(game: Pong): void {
    this.clearWalls(game);
    this.createWalls(game);
  }
}
