import type {
  GameMessage,
  GameStateMessage,
  PongUserInput,
  ServerMessage,
} from "../types/games/userInput";
import type { PongMinimalGameState } from "../types/games/pong/gameState";
import type Router from "./router.js";
import type { BallState } from "../types/games/pong/gameState";

declare global {
  interface Window {
    router: Router;
  }
}

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wallCanvas: HTMLCanvasElement;
  private timeDiv: HTMLDivElement;
  private wallCtx: CanvasRenderingContext2D;
  private wallsNeedRedraw = true;
  private gameState: PongMinimalGameState | null = null;
  private ratio = 0.0;
  private gameId: string;
  private isConnected = false;
  private debug = false;
  private rotationAngle = 0;
  private padding = 20;
  gameSocket: WebSocket;
  private currentUserId: string;
  private playerIndex = -1; // -1 means not determined yet
  private playerCount = 0;
  private referenceTable: string[] = [];
  private tps: number;

  private readonly KEY_MAPPINGS: Record<string, PongUserInput> = {
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    Space: "SPACE",
    " ": "SPACE",
  };

  private readonly KEY_RELEASE_MAPPINGS: Record<string, PongUserInput> = {
    ArrowUp: "STOP_UP",
    ArrowDown: "STOP_DOWN",
    Space: "STOP_SPACE",
    " ": "STOP_SPACE",
  };

  constructor(canvasId: string) {
    const path = window.location.pathname;
    this.gameId = path.split("/").pop() || "";
    if (!this.gameId) throw new Error("No gameId provided in URL parameters");
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);

    this.currentUserId = this.canvas.dataset.userid || "";
    this.tps = Number(this.canvas.dataset.tps) || 0;

    this.timeDiv = document.getElementById("time") as HTMLDivElement;

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context from canvas");
    this.ctx = context;

    this.wallCanvas = document.createElement("canvas");
    this.wallCanvas.width = this.canvas.width;
    this.wallCanvas.height = this.canvas.height;
    const wallContext = this.wallCanvas.getContext("2d");
    if (!wallContext)
      throw new Error("Failed to get 2D context from wall canvas");
    this.wallCtx = wallContext;

    this.canvas.width = 800 + this.padding * 2;
    this.canvas.height = 800 + this.padding * 2;
    this.wallCanvas.width = this.canvas.width;
    this.wallCanvas.height = this.canvas.height;
    this.ratio = (this.canvas.width - this.padding * 2) / 100.0;

    this.gameSocket = this.setupWebSocket();
    this.setupEventListeners();
    this.startGameLoop();
  }

  private setupWebSocket(): WebSocket {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/${this.gameId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = this.handleSocketOpen.bind(this);
    socket.onmessage = this.handleSocketMessage.bind(this);
    socket.onclose = this.handleSocketClose.bind(this);
    socket.onerror = this.handleSocketError.bind(this);

    return socket;
  }

  private handleSocketOpen(): void {
    console.log("Connected to game WebSocket");
    this.isConnected = true;
  }

  private handleSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as ServerMessage;

      switch (message.type) {
        case "gameState":
          this.handleGameStateMessage(message);
          break;
        case "gameFinished":
          this.handleGameFinishedMessage(message.data);
          break;
        case "redirect":
          this.handleRedirectMessage(message.data);
          break;
      }
    } catch (error) {
      if (this.debug)
        console.error("Error processing WebSocket message:", error);
    }
  }

  private handleGameStateMessage(message: GameStateMessage): void {
    const prevWalls = this.gameState?.walls || [];
    this.gameState = message.data as PongMinimalGameState;
    const currentWalls = this.gameState?.walls || [];

    // this.fillModifierWallsIDs();

    // Check if walls have changed (either count or properties)
    if (this.haveWallsChanged(prevWalls, currentWalls)) {
      this.wallsNeedRedraw = true;
    }

    if (message.referenceTable && this.playerIndex === -1) {
      this.referenceTable = message.referenceTable;
      this.playerIndex = message.referenceTable.indexOf(this.currentUserId);
      this.playerCount = message.referenceTable.length;

      if (this.playerCount === 2) {
        this.canvas.width = 800 + this.padding * 2;
        this.canvas.height = 400 + this.padding * 2;
        this.wallCanvas.width = this.canvas.width;
        this.wallCanvas.height = this.canvas.height;
        this.ratio = (this.canvas.width - this.padding * 2) / 200.0;
        this.wallsNeedRedraw = true;
      }

      if (this.playerIndex >= 0 && this.gameState?.paddles) {
        this.calculateRotationAngle();
      }
    }
  }

  private handleRedirectMessage(url: string): void {
    setTimeout(() => {
      this.disconnect();
      window.router.navigateTo(url);
    }, 5000);
  }

  private handleGameFinishedMessage(data: string): void {
    this.displayGameFinishedMessage(data);
  }

  private haveWallsChanged(prevWalls: any[], currentWalls: any[]): boolean {
    if (prevWalls.length !== currentWalls.length) return true;

    for (let i = 0; i < currentWalls.length; i++) {
      const prev = prevWalls[i];
      const curr = currentWalls[i];

      if (
        prev.x !== curr.x ||
        prev.y !== curr.y ||
        prev.w !== curr.w ||
        prev.h !== curr.h ||
        prev.dx !== curr.dx ||
        prev.dy !== curr.dy ||
        prev.doRot !== curr.doRot
      ) {
        return true;
      }
    }
    return false;
  }

  private displayGameFinishedMessage(html: string): void {
    this.canvas.style.opacity = "0.5";

    const messageContainer = document.createElement("div");
    messageContainer.innerHTML = html;
    messageContainer.className =
      "absolute inset-0 flex flex-col items-center justify-center text-white animate-fade-in";

    const parent = this.canvas.parentElement;
    if (parent) {
      parent.style.position = "relative";
      parent.appendChild(messageContainer);
    }
  }

  private calculateRotationAngle(): void {
    if (this.playerIndex < 0 || !this.gameState?.paddles) {
      return;
    }

    const paddle = this.gameState.paddles.find(
      (p) => p.id === this.playerIndex,
    );
    if (!paddle || paddle.a === undefined) return;
    const targetAngle = Math.PI;

    this.rotationAngle = (targetAngle - paddle.a) % (Math.PI * 2);

    if (this.rotationAngle > Math.PI) this.rotationAngle -= Math.PI * 2;
    if (this.rotationAngle < -Math.PI) this.rotationAngle += Math.PI * 2;

    console.log(
      `Player ${this.playerIndex} rotation: ${this.rotationAngle.toFixed(2)} radians`,
    );
  }

  private handleSocketClose(): void {
    console.log("Game WebSocket closed");
    this.isConnected = false;
  }

  private handleSocketError(error: Event): void {
    this.isConnected = false;
  }

  private setupEventListeners(): void {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const actionType = this.KEY_MAPPINGS[event.key];
    if (actionType) {
      event.preventDefault();
      this.sendGameInput(actionType);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const actionType = this.KEY_RELEASE_MAPPINGS[event.key];
    if (actionType) {
      event.preventDefault();
      this.sendGameInput(actionType);
    }
  }

  private sendGameInput(actionType: PongUserInput): void {
    if (!this.isConnected) return;

    const action: GameMessage = {
      type: "userInput",
      options: {
        timestamp: Date.now(),
        playerId: -1, // will be set in the server
        type: actionType,
      },
    };

    this.gameSocket.send(JSON.stringify(action));
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawWalls();

    this.ctx.drawImage(this.wallCanvas, 0, 0);

    this.ctx.save();
    this.ctx.translate(this.padding, this.padding);

    const shouldRotate = this.playerCount > 2 && this.playerIndex >= 0;

    this.applyCanvasTransformation(shouldRotate);

    if (this.gameState?.modifiersState?.spawnedPowerUps) this.drawPowerUps();
    if (this.gameState?.paddles) this.drawPaddles();
    if (this.gameState?.balls) this.drawBalls();

    if (this.gameState?.scores) {
      this.drawScores();
    }

    this.ctx.restore();

    if (this.debug) this.drawDebugElements();
  }

  private drawDebugElements(): void {
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    this.ctx.fillStyle = "white";
    this.ctx.font = "14px ui-sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Canvas: ${this.canvas.width}x${this.canvas.height}, Ratio: ${this.ratio.toFixed(2)}`,
      10,
      40,
    );

    const gameStateInfo = this.gameState
      ? `Game objects: ${Object.keys(this.gameState).join(", ")}`
      : "No game state received yet";
    this.ctx.fillText(gameStateInfo, 10, 60);

    // Add rotation debug info
    this.ctx.fillText(
      `Player Index: ${this.playerIndex}, Rotation: ${this.rotationAngle.toFixed(2)} rad (${((this.rotationAngle * 180) / Math.PI).toFixed(2)}°)`,
      10,
      80,
    );

    // Add paddle position debug info if available
    if (this.playerIndex >= 0 && this.gameState?.paddles[this.playerIndex]) {
      const paddle = this.gameState.paddles[this.playerIndex];
      this.ctx.fillText(
        `Paddle Pos: x=${paddle.x.toFixed(1)}, y=${paddle.y.toFixed(1)}, alpha=${paddle.a.toFixed(3)} rad`,
        10,
        100,
      );
    }

    // Draw a direction indicator showing the rotation effect
    const centerX = 750;
    const centerY = 50;
    const radius = 30;

    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "white";
    this.ctx.stroke();

    // Draw direction line (points left before rotation)
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX - radius, centerY);
    this.ctx.strokeStyle = "gray";
    this.ctx.stroke();

    // Draw rotated direction line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(
      centerX + radius * Math.cos(Math.PI + this.rotationAngle),
      centerY + radius * Math.sin(Math.PI + this.rotationAngle),
    );
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  private drawBalls(): void {
    if (!this.gameState?.balls) return;

    this.gameState.balls.forEach((ball) => {
      this.ctx.fillStyle = "white";
      this.ctx.beginPath();
      this.ctx.arc(
        ball.x * this.ratio,
        ball.y * this.ratio,
        ball.r * this.ratio,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    });
  }

  private drawPaddles(): void {
    if (!this.gameState?.paddles) return;

    for (let paddle of this.gameState.paddles) {
      const angle = paddle.a + Math.PI / 2;
      const x = paddle.x * this.ratio;
      const y = paddle.y * this.ratio;
      const width = paddle.w * this.ratio;
      const height = paddle.h * this.ratio;

      const paddleColor =
        paddle.id === this.playerIndex ? "#ff00ff" : "#00ffff";

      this.drawNeonRectangle(x, y, width, height, paddleColor, angle);
    }
  }

  private drawWalls(): void {
    if (!this.gameState?.walls || !this.wallsNeedRedraw) return;

    this.wallCtx.clearRect(0, 0, this.wallCanvas.width, this.wallCanvas.height);

    this.wallCtx.save();
    this.wallCtx.translate(this.padding, this.padding);

    const shouldRotate = this.playerCount > 2 && this.playerIndex >= 0;
    this.applyCanvasTransformationToContext(this.wallCtx, shouldRotate);

    this.gameState.walls.forEach((wall, wallIndex) => {
      if (wall.doRot) {
        const angle = Math.atan2(wall.dy, wall.dx);
        const x = wall.x * this.ratio;
        const y = wall.y * this.ratio;
        const width = wall.w * this.ratio;
        const height = wall.h * this.ratio;

        if (this.gameState?.specialWallsIDs.portal.includes(wallIndex)) {
          // 'portal' effect walls
          this.drawNeonRectangleToContext(
            this.wallCtx,
            x,
            y,
            width,
            height,
            "#ffa500",
            angle,
          );
        } else if (this.gameState?.specialWallsIDs.bumper.includes(wallIndex)) {
          // 'bumper' effects walls
          this.drawNeonRectangleToContext(
            this.wallCtx,
            x,
            y,
            width,
            height,
            "#bf00ff",
            angle,
          );
        } else {
          this.drawNeonRectangleToContext(
            this.wallCtx,
            x,
            y,
            width,
            height,
            "#ffffff",
            angle,
          );
        }
      }
    });

    this.wallCtx.restore();

    this.wallCtx.save();
    this.wallCtx.translate(this.padding, this.padding);

    this.gameState.walls.forEach((wall) => {
      if (!wall.doRot) {
        const angle = Math.atan2(wall.dy, wall.dx);
        const x = wall.x * this.ratio;
        const y = wall.y * this.ratio;
        const width = wall.w * this.ratio;
        const height = wall.h * this.ratio;

        this.drawNeonRectangleToContext(
          this.wallCtx,
          x,
          y,
          width,
          height,
          "#ffffff",
          angle,
        );
      }
    });

    this.wallCtx.restore();
    this.wallsNeedRedraw = false;
  }

  private drawPowerUps(): void {
    if (!this.gameState?.modifiersState?.spawnedPowerUps) return;

    Object.entries(this.gameState.modifiersState.spawnedPowerUps).forEach(
      ([type, powerUpList]: [string, BallState[]]) => {
        powerUpList.forEach((powerUp) => {
          const x = powerUp.x * this.ratio;
          const y = powerUp.y * this.ratio;
          const radius = powerUp.r * this.ratio;
          const color = this.getPowerUpColor(type);

          this.drawNeonCircle(x, y, radius, color);
        });
      },
    );
  }

  private getPowerUpColor(type: string): string {
    switch (type) {
      case "speedBoost":
        return "#ff1493"; // neon pink/red
      case "blinkingBall":
        return "#00ffff"; // cyan/neon blue
      case "multiBall":
        return "#39ff14"; // electric green
      case "shooter":
        return "#ffff33"; // bright yellow
      case "bumper":
        return "#bf00ff"; // vivid purple
      case "portals":
        return "#ff6ec7"; // Magenta pink
      case "speedGate":
        return "#00ffcc"; // Aqua teal
      case "protectedPowerUp":
        return "#ff9933"; // Orange
      case "bumperShield":
        return "#cc00ff"; // Violet
      default:
        return "#7fff00"; // chartreuse
    }
  }

  private drawScores(): void {
    if (!this.gameState?.scores || !this.referenceTable.length) return;

    const scores = this.gameState.scores;

    if (this.playerCount === 2) {
      this.updateScoreDisplay(this.referenceTable[0], scores[1] || 0);
      this.updateScoreDisplay(this.referenceTable[1], scores[0] || 0);
    } else {
      this.referenceTable.forEach((userId, i) => {
        this.updateScoreDisplay(userId, scores[i] || 0);
      });
    }
    const timedGame = this.gameState.modifiersState?.modifiersState?.timedGame;
    if (!timedGame) return;
    this.updateTimeDisplay(timedGame.ticks);
  }

  private updateTimeDisplay(time: number): void {
    if (this.timeDiv && time) {
      const totalSeconds = Math.floor(time / this.tps);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.timeDiv.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  private updateScoreDisplay(userId: string, score: number): void {
    const scoreElement = document.getElementById(`result-${userId}`);
    if (scoreElement) {
      scoreElement.textContent = score.toString();
    }
  }

  private startGameLoop(): void {
    const gameLoop = (): void => {
      this.draw();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  public disconnect(): void {
    if (this.gameSocket && this.isConnected) {
      this.gameSocket.close();
    }
  }

  public reconnect(): void {
    if (!this.isConnected) {
      this.gameSocket = this.setupWebSocket();
    }
  }

  private drawNeonRectangleToContext(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    angle = 0,
  ): void {
    const [r, g, b] = this.parseHexColor(color);

    ctx.save();
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Draw fill with semi-transparent color
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
    ctx.fillRect(-halfWidth, -halfHeight, width, height);

    // Draw border with glow effect
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 8;
    ctx.strokeRect(-halfWidth, -halfHeight, width, height);

    // Draw bright inner border
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(-halfWidth, -halfHeight, width, height);

    ctx.restore();
  }

  private drawNeonRectangleFromCenter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dirX: number,
    dirY: number,
    halfLengthDir: number,
    halfLengthNormal: number,
    colors: [string, string, string, string], // [top, right, bottom, left]
  ): void {
    const scale = (x: number, y: number, s: number): [number, number] => [
      x * s,
      y * s,
    ];
    const add = (
      a: [number, number],
      b: [number, number],
    ): [number, number] => [a[0] + b[0], a[1] + b[1]];
    const sub = (
      a: [number, number],
      b: [number, number],
    ): [number, number] => [a[0] - b[0], a[1] - b[1]];

    const [normalX, normalY] = [-dirY, dirX]; // Perpendicular

    const dirVec = scale(dirX, dirY, halfLengthDir);
    const normVec = scale(normalX, normalY, halfLengthNormal);

    // Compute rectangle vertices in clockwise order
    const p1 = add(add([cx, cy], dirVec), normVec); // top-right
    const p2 = sub(add([cx, cy], dirVec), normVec); // bottom-right
    const p3 = sub(sub([cx, cy], dirVec), normVec); // bottom-left
    const p4 = add(sub([cx, cy], dirVec), normVec); // top-left

    const points: [number, number][][] = [
      [p4, p1], // top
      [p1, p2], // right
      [p2, p3], // bottom
      [p3, p4], // left
    ];

    points.forEach(([start, end], i) => {
      const [r, g, b] = this.parseHexColor(colors[i]);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowBlur = 8;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Optional bright white highlight
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.restore();
    });
  }

  private drawNeonRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    angle = 0,
  ): void {
    this.drawNeonRectangleToContext(
      this.ctx,
      x,
      y,
      width,
      height,
      color,
      angle,
    );
  }

  private drawNeonCircle(
    x: number,
    y: number,
    radius: number,
    color: string,
  ): void {
    const [r, g, b] = this.parseHexColor(color);

    this.ctx.save();

    // Draw fill with semi-transparent color
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw border with glow effect
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();

    // Draw bright inner border
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = "#fff";
    this.ctx.stroke();

    this.ctx.restore();
  }

  private parseHexColor(color: string): [number, number, number] {
    let r = 255,
      g = 255,
      b = 255;

    if (color?.startsWith("#")) {
      if (color.length === 7) {
        r = Number.parseInt(color.slice(1, 3), 16);
        g = Number.parseInt(color.slice(3, 5), 16);
        b = Number.parseInt(color.slice(5, 7), 16);
      } else if (color.length === 4) {
        r = Number.parseInt(color.charAt(1) + color.charAt(1), 16);
        g = Number.parseInt(color.charAt(2) + color.charAt(2), 16);
        b = Number.parseInt(color.charAt(3) + color.charAt(3), 16);
      }
    }

    r = Number.isNaN(r) ? 255 : Math.max(0, Math.min(255, r));
    g = Number.isNaN(g) ? 255 : Math.max(0, Math.min(255, g));
    b = Number.isNaN(b) ? 255 : Math.max(0, Math.min(255, b));

    return [r, g, b];
  }

  private applyCanvasTransformationToContext(
    ctx: CanvasRenderingContext2D,
    shouldRotate: boolean,
  ): void {
    const paddedWidth = this.canvas.width - this.padding * 2;
    const paddedHeight = this.canvas.height - this.padding * 2;

    if (shouldRotate) {
      ctx.translate(paddedWidth / 2, paddedHeight / 2);
      ctx.rotate(this.rotationAngle);
      ctx.translate(-paddedWidth / 2, -paddedHeight / 2);
    } else {
      const classicRotate = this.playerIndex === 1;
      if (classicRotate) {
        ctx.translate(paddedWidth, paddedHeight);
        ctx.rotate(Math.PI);
      }
    }
  }

  private applyCanvasTransformation(shouldRotate: boolean): void {
    this.applyCanvasTransformationToContext(this.ctx, shouldRotate);
  }
}

function initPongGame() {
  try {
    if (document.getElementById("gameCanvas")) {
      return new PongGame("gameCanvas");
    }
    throw new Error("Canvas element with id 'gameCanvas' not found");
  } catch (error) {
    const errorMessage = document.createElement("div");
    // errorMessage.textContent = `Error initializing Pong game: ${error}`;
    // errorMessage.style.color = "red";
    // errorMessage.style.fontSize = "20px";
    // errorMessage.style.textAlign = "center";
    // errorMessage.style.marginTop = "20px";
    document.body.appendChild(errorMessage);
  }
}

export { PongGame };
export { initPongGame };
