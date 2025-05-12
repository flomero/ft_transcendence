import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";

export class SpeedGate extends TimeLimitedModifierBase {
  name = "speedGate";

  protected initialBallSizeSmallPortalWidthFactor: number = 0;
  protected initialBallSizeBigPortalWidthFactor: number = 0;

  protected portalWidthArenaHeightFactor: number = 0; // compared to arenaHeight / 2

  protected portalUseThreshold: number = 0;
  protected portalUseCount: number = 0;

  protected meanSpeedGateDstFromCenterFactor: number = 0;
  protected stdDevSpeedGateDstFromCenterFactor: number = 0;

  protected sizeFactor: number = 0;
  protected speedFactor: number = 0;

  portalWalls: Rectangle[] = [];

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
      "initialBallSizeSmallPortalWidthFactor",
      (_, context) => {
        const initialBallSizeSmallPortalWidthPercent =
          context.initialBallSizeSmallPortalWidthFactor ||
          defaultRegistry.initialBallSizeSmallPortalWidthPercent;
        return initialBallSizeSmallPortalWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "initialBallSizeBigPortalWidthFactor",
      (_, context) => {
        const initialBallSizeBigPortalWidthPercent =
          context.initialBallSizeBigPortalWidthFactor ||
          defaultRegistry.initialBallSizeBigPortalWidthPercent;
        return initialBallSizeBigPortalWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "portalWidthArenaHeightFactor",
      (_, context) => {
        const portalWidthArenaHeightPercent =
          context.portalWidthArenaHeightFactor ||
          defaultRegistry.portalWidthArenaHeightPercent;
        return portalWidthArenaHeightPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "meanSpeedGateDstFromCenterFactor",
      (_, context) => {
        const meanSpeedGateDstFromCenterPercent =
          context.meanSpeedGateDstFromCenterFactor ||
          defaultRegistry.meanSpeedGateDstFromCenterPercent;
        return meanSpeedGateDstFromCenterPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "stdDevSpeedGateDstFromCenterFactor",
      (_, context) => {
        const stdDevSpeedGateDstFromCenterPercent =
          context.stdDevSpeedGateDstFromCenterFactor ||
          defaultRegistry.stdDevSpeedGateDstFromCenterPercent;
        return stdDevSpeedGateDstFromCenterPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "portalUseThreshold",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "portalPositionSamplerStrategyName",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "sizeFactor",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "speedFactor",
      (value) => value,
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
    this.createPortalWalls(game);
  }

  protected createPortalWalls(game: Pong) {
    const gameSettings = game.getSettings();
    const gameState = game.getState();

    // 0. Compute constants
    const smallPortalWallWidth =
      this.initialBallSizeSmallPortalWidthFactor *
      gameSettings.ballRadius *
      2.0;
    const bigPortalWallWidth =
      this.initialBallSizeBigPortalWidthFactor * gameSettings.ballRadius * 2.0;
    const portalWallsInnerWidth =
      (this.portalWidthArenaHeightFactor * gameSettings.arenaHeight) / 2.0;

    // 1. Place the speedGate
    const safeRadius =
      gameSettings.arenaHeight / 2.0 - bigPortalWallWidth / 2.0;

    let rndDst = game
      .getRNG()
      .randomGaussian(
        this.meanSpeedGateDstFromCenterFactor * safeRadius,
        this.stdDevSpeedGateDstFromCenterFactor * safeRadius,
      );
    rndDst = Math.min(safeRadius, Math.max(rndDst, 0.0));
    const rndAngle = game.getRNG().random() * Math.PI * 2.0;
    const trapezoideCenterPos = {
      x: gameSettings.arenaWidth / 2.0 + rndDst * Math.cos(rndAngle),
      y: gameSettings.arenaHeight / 2.0 + rndDst * Math.sin(rndAngle),
    };

    const trapezoideAngle =
      gameState.playerCount === 2
        ? game.getRNG().randomSign() * Math.PI
        : game.getRNG().random() * Math.PI * 2.0;
    // if (gameState.playerCount > 2)
    //   trapezoideAngle = game.getRNG().random() * Math.PI * 2.0;

    const trapezoideDir = {
      x: Math.cos(trapezoideAngle),
      y: Math.sin(trapezoideAngle),
    };

    // 2. Compute gateWalls
    const deltaWidth = (bigPortalWallWidth - smallPortalWallWidth) / 2.0;
    const centralOffset = deltaWidth + smallPortalWallWidth / 2.0;
    const theta = Math.atan2(deltaWidth, portalWallsInnerWidth);
    const legWall1Dir = {
      x: -Math.cos(trapezoideAngle + theta),
      y: -Math.sin(trapezoideAngle + theta),
    };
    const legWall2Dir = {
      x: Math.cos(trapezoideAngle - theta),
      y: Math.sin(trapezoideAngle - theta),
    };
    const legWallWidth = Math.hypot(deltaWidth, portalWallsInnerWidth);

    const gateWallHeight = gameSettings.paddleHeight / 2.0;
    const legWallHeight = gameSettings.paddleHeight;

    // 3. Build walls.
    const smallPortalWall: Rectangle = {
      id: gameState.walls.length,
      x:
        trapezoideCenterPos.x +
        trapezoideDir.x * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      y:
        trapezoideCenterPos.y +
        trapezoideDir.y * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      alpha: trapezoideAngle - Math.PI / 2.0,
      dx: trapezoideDir.y,
      dy: -trapezoideDir.x,
      nx: trapezoideDir.x,
      ny: trapezoideDir.y,
      absX:
        trapezoideCenterPos.x +
        trapezoideDir.x * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      absY:
        trapezoideCenterPos.y +
        trapezoideDir.y * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      width: smallPortalWallWidth,
      height: gateWallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: false,
      doResolveCollision: false,
    };

    const bigPortalWall: Rectangle = {
      id: gameState.walls.length + 1,
      x:
        trapezoideCenterPos.x -
        trapezoideDir.x * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      y:
        trapezoideCenterPos.y -
        trapezoideDir.y * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      alpha: trapezoideAngle + Math.PI / 2.0,
      dx: -trapezoideDir.y,
      dy: trapezoideDir.x,
      nx: -trapezoideDir.x,
      ny: -trapezoideDir.y,
      absX:
        trapezoideCenterPos.x -
        trapezoideDir.x * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      absY:
        trapezoideCenterPos.y -
        trapezoideDir.y * (portalWallsInnerWidth / 2.0 - 2 * gateWallHeight),
      width: bigPortalWallWidth,
      height: gateWallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: false,
      doResolveCollision: false,
    };

    const legWall1: Rectangle = {
      id: gameState.walls.length + 2,
      x:
        trapezoideCenterPos.x +
        trapezoideDir.y * (centralOffset + 2 * legWallHeight),
      y:
        trapezoideCenterPos.y -
        trapezoideDir.x * (centralOffset + 2 * legWallHeight),
      alpha: trapezoideAngle + theta,
      dx: legWall1Dir.x,
      dy: legWall1Dir.y,
      nx: -legWall1Dir.y,
      ny: legWall1Dir.x,
      absX:
        trapezoideCenterPos.x +
        trapezoideDir.y * (centralOffset + 2 * legWallHeight),
      absY:
        trapezoideCenterPos.y -
        trapezoideDir.x * (centralOffset + 2 * legWallHeight),
      width: (legWallWidth * 105) / 100,
      height: legWallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: true,
      doResolveCollision: true,
    };

    const legWall2: Rectangle = {
      id: gameState.walls.length + 3,
      x:
        trapezoideCenterPos.x -
        trapezoideDir.y * (centralOffset + 2 * legWallHeight),
      y:
        trapezoideCenterPos.y +
        trapezoideDir.x * (centralOffset + 2 * legWallHeight),
      alpha: trapezoideAngle - theta,
      dx: legWall2Dir.x,
      dy: legWall2Dir.y,
      nx: -legWall2Dir.y,
      ny: legWall2Dir.x,
      absX:
        trapezoideCenterPos.x -
        trapezoideDir.y * (centralOffset + 2 * legWallHeight),
      absY:
        trapezoideCenterPos.y +
        trapezoideDir.x * (centralOffset + 2 * legWallHeight),
      width: (legWallWidth * 105) / 100,
      height: legWallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: true,
      doResolveCollision: true,
    };

    // 3. Save the walls

    this.portalWalls.push(
      ...[smallPortalWall, bigPortalWall, legWall1, legWall2],
    );
    gameState.walls.push(...this.portalWalls);
  }

  onDeactivation(game: Pong): void {
    if (game.getState().walls.length > 0)
      this.portalWalls.forEach((portalWall) => {
        const wallID = game.getState().walls.indexOf(portalWall);
        if (wallID < 0) return;
        game.getState().walls.splice(wallID, 1);
      });
    game.getModifierManager().deletePowerUp(this);
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }) {
    const state = game.getState();
    const ball = state.balls[args.ballID];

    // 1) Which base did we hit? (0 = small, 1 = big)
    const portalIDs = this.portalWalls.map((w) => state.walls.indexOf(w));
    const srcIndex = portalIDs.indexOf(args.wallID);
    if (srcIndex < 0 || srcIndex > 1) return; // ignore the leg walls
    const dstIndex = 1 - srcIndex;
    const dst = this.portalWalls[dstIndex];

    // 2) Apply constant size/speed change
    if (srcIndex === 1) {
      // big→small: shrink and speed up
      ball.radius *= 1 / this.sizeFactor;
      ball.speed *= this.speedFactor;
    } else {
      // small→big: grow and slow down
      ball.radius *= this.sizeFactor;
      ball.speed /= this.speedFactor;
    }

    // 3) Teleport out along the dst normal
    const offset =
      dst.height / 2 + ball.radius + game.getSettings().wallsHeight / 2.0;
    ball.x = dst.x + dst.nx * offset;
    ball.y = dst.y + dst.ny * offset;

    // 4) New direction
    const outAngle = Math.atan2(dst.ny, dst.nx);
    const rndAngularOffset =
      game.getRNG().random() *
      Math.abs(this.portalWalls[2].alpha - this.portalWalls[3].alpha);

    ball.dx = Math.cos(outAngle + rndAngularOffset);
    ball.dy = Math.sin(outAngle + rndAngularOffset);

    if (args.ballID === 0 && ++this.portalUseCount >= this.portalUseThreshold)
      this.deactivate(game);
  }
}
