import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";
import { Rectangle } from "../../../../types/games/pong/rectangle";

export class Portals extends TimeLimitedModifierBase {
  name = "portals";

  protected portalWallWidthHeightFactor: number = 0;
  protected useNaturalSide: boolean = true;
  protected useBothSides: boolean = true;

  protected directionalOffsetFactor: number = 0;
  protected directionalOffsetStandardDeviationFactor: number = 0;

  protected normalOffsetFactor: number = 0;
  protected normalOffsetStandardDeviationFactor: number = 0;

  protected portalWalls: Rectangle[] = [];

  protected teleportationCount: number = 0;
  protected teleportationCountThrehsold: number = 0;

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
      "portalWallWidthHeightFactor",
      (_, context) => {
        const portalWallWidthHeightPercent =
          context.portalWallWidthHeightFactor ||
          defaultRegistry.portalWallWidthHeightPercent;
        return portalWallWidthHeightPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "directionalOffsetFactor",
      (_, context) => {
        const directionalOffsetPercent =
          context.directionalOffsetFactor ||
          defaultRegistry.directionalOffsetPercent;
        return directionalOffsetPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "directionalOffsetStandardDeviationFactor",
      (_, context) => {
        const directionalOffsetStandardDeviationPercent =
          context.directionalOffsetStandardDeviationFactor ||
          defaultRegistry.directionalOffsetStandardDeviationPercent;
        return directionalOffsetStandardDeviationPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "normalOffsetFactor",
      (_, context) => {
        const normalOffsetPercent =
          context.normalOffsetFactor || defaultRegistry.normalOffsetPercent;
        return normalOffsetPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "normalOffsetStandardDeviationFactor",
      (_, context) => {
        const normalOffsetStandardDeviationPercent =
          context.normalOffsetStandardDeviationFactor ||
          defaultRegistry.normalOffsetStandardDeviationPercent;
        return normalOffsetStandardDeviationPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "useNaturalSide",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "useBothSides",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "teleportationCountThrehsold",
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
    // Generate portal walls
    this.createPortalWalls(game);
  }

  protected createPortalWalls(game: Pong) {
    const gameState = game.getState();
    const gameSettings = game.getSettings();

    const arenaCenter = {
      x: gameSettings.arenaWidth / 2.0,
      y: gameSettings.arenaHeight / 2.0,
    };

    const R =
      gameSettings.arenaHeight / 2.0 -
      (this.portalWallWidthHeightFactor * gameSettings.arenaHeight) / 2.0;

    // 1. Generate random direction vector D
    const angleD = Math.random() * 2 * Math.PI;
    const D = { x: Math.cos(angleD), y: Math.sin(angleD) };

    // 2. Compute normal N
    const N = { x: -D.y, y: D.x };

    // 3. Random offsets (using uniform or normal approximation)
    let Od = game
      .getRNG()
      .randomGaussian(
        this.directionalOffsetFactor * R,
        this.directionalOffsetStandardDeviationFactor * R,
      );
    let On = game
      .getRNG()
      .randomGaussian(
        this.normalOffsetFactor * R,
        this.normalOffsetStandardDeviationFactor * R,
      );

    Od = Math.min(R, Math.max(Od, 0));

    On = Math.min(Math.sqrt(R ** 2 - Od ** 2), Math.max(On, 0));

    // 4. Compute portal centers
    const center1 = {
      x: arenaCenter.x + D.x * Od + N.x * On,
      y: arenaCenter.y + D.y * Od + N.y * On,
    };

    const center2 = {
      x: arenaCenter.x - D.x * Od - N.x * On,
      y: arenaCenter.y - D.y * Od - N.y * On,
    };

    const alpha1 = Math.PI / 2 + game.getRNG().random() * Math.PI;
    const alpha2 = Math.PI / 2 + game.getRNG().random() * Math.PI;

    const ca1 = Math.cos(alpha1);
    const sa1 = Math.sin(alpha1);

    const ca2 = Math.cos(alpha2);
    const sa2 = Math.sin(alpha2);

    const wallHeight = gameSettings.paddleHeight * 1.25;

    // 5. Save portalWalls
    const portalWall1: Rectangle = {
      id: gameState.walls.length,
      x: center1.x,
      y: center1.y,
      alpha: alpha1,
      dx: ca1,
      dy: sa1,
      nx: -sa1,
      ny: ca1,
      absX: center1.x,
      absY: center1.y,
      width:
        (this.portalWallWidthHeightFactor * gameSettings.arenaHeight) / 2.0,
      height: wallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: false,
      doResolveCollision: true,
    };

    const portalWall2: Rectangle = {
      id: gameState.walls.length + 1,
      x: center2.x,
      y: center2.y,
      alpha: alpha2,
      dx: ca2,
      dy: sa2,
      nx: -sa2,
      ny: ca2,
      absX: center2.x,
      absY: center2.y,
      width:
        (this.portalWallWidthHeightFactor * gameSettings.arenaHeight) / 2.0,
      height: wallHeight,
      doCollision: true,
      doRotation: true,
      isVisible: true,
      doGoal: false,
      doBoundsProtection: false,
      doResolveCollision: false,
    };

    this.portalWalls = [portalWall1, portalWall2];
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

    // 1) Identify portal
    const portalIDs = this.portalWalls.map((w) => state.walls.indexOf(w));
    const srcIndex = portalIDs.indexOf(args.wallID);
    if (srcIndex < 0) return;
    const dstIndex = 1 - srcIndex;
    const src = this.portalWalls[srcIndex];
    const dst = this.portalWalls[dstIndex];

    // 2) Reconstruct incoming vector
    const d = { x: ball.dx, y: ball.dy };
    const n = { x: src.nx, y: src.ny };
    const dot = d.x * n.x + d.y * n.y;
    const inc = { x: d.x - 2 * dot * n.x, y: d.y - 2 * dot * n.y };

    // 3) Filter back‐side if needed
    const sideDot = inc.x * n.x + inc.y * n.y; // >0 front, <0 back
    if (!this.useBothSides && sideDot < 0) return;

    // 4) Hit‐percent along tangent
    const t = { x: src.dx, y: src.dy };
    const rel = { x: ball.x - src.x, y: ball.y - src.y };
    const half = src.width;
    const p = (rel.x * t.x + rel.y * t.y) / half;

    // 5) Where on the dst wall to exit
    const exitCenter = {
      x: dst.x + dst.dx * p * half,
      y: dst.y + dst.dy * p * half,
    };

    // 6) Preserve angle‐relative‐to‐wall, then maybe flip
    const angleInc = Math.atan2(inc.y, inc.x);
    const deltaAng = angleInc - src.alpha;
    let outAngle = dst.alpha + deltaAng;

    // **useNaturalSide logic**: only flip if hit was from back and
    // we’re *not* preserving natural sides
    if (!this.useNaturalSide && sideDot < 0) {
      outAngle += Math.PI;
    }

    // 7a) Decide exit‐face:
    const entryFront = sideDot > 0; // true if hit front of src
    const exitFront = this.useNaturalSide
      ? entryFront // natural: same side
      : !entryFront; // unnatural: flip side

    // if we’re in ‘flip‐both’ mode (i.e. useNaturalSide=false ALWAYS),
    // we should also flip the angle by PI every time:
    if (!this.useNaturalSide) {
      outAngle += Math.PI;
    }

    // 7b) Recompute outDir with possibly-flipped angle
    const outDir = { x: Math.cos(outAngle), y: Math.sin(outAngle) };

    // 7c) Teleport the ball to the correct face of dst
    const offsetDist = dst.height + ball.radius; // you can use dst.height/2 + ball.radius + margin
    const sign = exitFront ? +1 : -1;

    ball.x = exitCenter.x + dst.nx * offsetDist * sign;
    ball.y = exitCenter.y + dst.ny * offsetDist * sign;
    ball.dx = outDir.x;
    ball.dy = outDir.y;

    if (
      args.ballID === 0 &&
      ++this.teleportationCount >= this.teleportationCountThrehsold
    )
      this.deactivate(game);
  }

  getState(): Record<string, any> {
    if (this.portalWalls.length < 2) return {};

    const wall1 = this.portalWalls[0];
    const wall2 = this.portalWalls[1];

    return {
      p1: {
        x: parseFloat(wall1.x.toFixed(3)),
        y: parseFloat(wall1.y.toFixed(3)),
      },

      p2: {
        x: parseFloat(wall2.x.toFixed(3)),
        y: parseFloat(wall2.y.toFixed(3)),
      },
    };
  }
}
