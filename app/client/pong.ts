import type { GameMessage } from "../types/games/userInput";
import type { PongGameState } from "../types/games/pong/gameState";
import type { Ball } from "../types/games/pong/ball";

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: PongGameState | null = null;
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

  constructor(canvasId: string) {
    const path = window.location.pathname;
    this.gameId = path.split("/").pop() || "";
    if (!this.gameId) throw new Error("No gameId provided in URL parameters");
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);

    this.currentUserId = this.canvas.dataset.userid || "";

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context from canvas");
    this.ctx = context;

    this.canvas.width = 800;
    this.canvas.height = 800;
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
      const message = JSON.parse(event.data);

      if (message.type === "gameState") {
        const parsedData = JSON.parse(message.data);
        this.gameState = parsedData;

        if (message.referenceTable && this.playerIndex === -1) {
          this.referenceTable = message.referenceTable; // Store the reference table
          this.playerIndex = message.referenceTable.indexOf(this.currentUserId);
          this.playerCount = message.referenceTable.length;
          if (this.playerCount === 2) {
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.ratio = (this.canvas.width - this.padding * 2) / 200.0;
          }
          if (
            this.playerIndex >= 0 &&
            this.gameState?.paddles[this.playerIndex]
          ) {
            this.calculateRotationAngle();
          }
        }
      }
    } catch (error) {}
  }

  private calculateRotationAngle(): void {
    if (this.playerIndex < 0 || !this.gameState?.paddles[this.playerIndex]) {
      return;
    }

    const paddle = this.gameState.paddles[this.playerIndex];

    if (!paddle || paddle.alpha === undefined) return;
    const targetAngle = Math.PI;

    this.rotationAngle = (targetAngle - paddle.alpha) % (Math.PI * 2);

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
    const action: GameMessage = {
      type: "userInput",
      options: {
        timestamp: Date.now(),
        playerId: -1, // will be set in the server
      },
    };

    if (event.key === "ArrowUp") action.options.type = "UP";
    if (event.key === "ArrowDown") action.options.type = "DOWN";
    if (event.key === "Space") action.options.type = "SPACE";

    if (action.options.type && this.isConnected) {
      this.gameSocket.send(JSON.stringify(action));
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const action: GameMessage = {
      type: "userInput",
      options: {
        timestamp: Date.now(),
        playerId: -1, // will be set in the server
      },
    };

    if (event.key === "ArrowUp") action.options.type = "STOP_UP";
    if (event.key === "ArrowDown") action.options.type = "STOP_DOWN";
    if (event.key === "Space") action.options.type = "STOP_SPACE";

    if (action.options.type && this.isConnected) {
      this.gameSocket.send(JSON.stringify(action));
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.padding, this.padding);

    const shouldRotate = this.playerCount > 2 && this.playerIndex >= 0;

    if (shouldRotate) {
      const paddedWidth = this.canvas.width - this.padding * 2;
      const paddedHeight = this.canvas.height - this.padding * 2;

      this.ctx.translate(paddedWidth / 2, paddedHeight / 2);
      this.ctx.rotate(this.rotationAngle);
      this.ctx.translate(-paddedWidth / 2, -paddedHeight / 2);
    } else {
      const classicRotate = this.playerIndex === 1;
      if (classicRotate) {
        const paddedWidth = this.canvas.width - this.padding * 2;
        const paddedHeight = this.canvas.height - this.padding * 2;

        this.ctx.translate(paddedWidth, paddedHeight);
        this.ctx.rotate(Math.PI);
      }
    }

    if (this.gameState?.walls) this.drawWalls(true);
    if (this.gameState?.modifiersState?.spawnedPowerUps) this.drawPowerUps();
    if (this.gameState?.paddles) this.drawPaddles();
    if (this.gameState?.balls) this.drawBalls();

    if (this.gameState?.scores) {
      this.drawScores();
    }

    this.ctx.restore();
    this.drawWalls(false);

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
        `Paddle Pos: x=${paddle.x.toFixed(1)}, y=${paddle.y.toFixed(1)}, alpha=${paddle.alpha.toFixed(3)} rad`,
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
      if (ball.isVisible) {
        this.ctx.fillStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(
          ball.x * this.ratio,
          ball.y * this.ratio,
          ball.radius * this.ratio,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      }
    });
  }

  private drawPaddles(): void {
    if (!this.gameState?.paddles) return;

    this.gameState.paddles.forEach((paddle, index) => {
      if (paddle.isVisible) {
        const angle = Math.atan2(paddle.dy, paddle.dx);
        const x = paddle.x * this.ratio;
        const y = paddle.y * this.ratio;
        const width = paddle.width * this.ratio;
        const height = paddle.height * this.ratio;

        const paddleColor = index === this.playerIndex ? "#ff00ff" : "#00ffff";

        this.drawNeonRectangle(x, y, width, height, paddleColor, angle);
      }
    });
  }

  private drawWalls(rotated: boolean): void {
    if (!this.gameState?.walls) return;

    this.gameState.walls.forEach((wall) => {
      if (wall.isVisible && wall.doRotation === rotated) {
        const angle = Math.atan2(wall.dy, wall.dx);
        const x = wall.x * this.ratio;
        const y = wall.y * this.ratio;
        const width = wall.width * this.ratio;
        const height = wall.height * this.ratio;

        this.drawNeonRectangle(x, y, width, height, "#ffffff", angle);
      }
    });
  }

  private drawPowerUps(): void {
    if (!this.gameState?.modifiersState?.spawnedPowerUps) return;

    for (const [type, powerUp] of this.gameState.modifiersState
      .spawnedPowerUps as [string, Ball][]) {
      if (powerUp.isVisible) {
        const x = powerUp.x * this.ratio;
        const y = powerUp.y * this.ratio;
        const radius = powerUp.radius * this.ratio;
        const color = this.getPowerUpColor(type);

        this.drawNeonCircle(x, y, radius, color);
      }
    }
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

    this.ctx.restore();
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

  private drawNeonRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    angle = 0,
  ): void {
    let r = 255;
    let g = 255;
    let b = 255;

    // Parse color from hex to RGB
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

    this.ctx.save();
    this.ctx.translate(x, y);
    if (angle) this.ctx.rotate(angle);

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Draw fill with semi-transparent color
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
    this.ctx.fillRect(-halfWidth, -halfHeight, width, height);

    // Draw border with glow effect
    this.ctx.lineJoin = "round";
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowBlur = 8;
    this.ctx.strokeRect(-halfWidth, -halfHeight, width, height);

    // Draw bright inner border
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = "#fff";
    this.ctx.strokeRect(-halfWidth, -halfHeight, width, height);

    this.ctx.restore();
  }

  private drawNeonCircle(
    x: number,
    y: number,
    radius: number,
    color: string,
  ): void {
    let r = 255;
    let g = 255;
    let b = 255;

    // Parse color from hex to RGB
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
}

function initPongGame() {
  try {
    if (document.getElementById("gameCanvas")) {
      return new PongGame("gameCanvas");
    }
    throw new Error("Canvas element with id 'gameCanvas' not found");
  } catch (error) {
    const errorMessage = document.createElement("div");
    errorMessage.textContent = `Error initializing Pong game: ${error}`;
    errorMessage.style.color = "red";
    errorMessage.style.fontSize = "20px";
    errorMessage.style.textAlign = "center";
    errorMessage.style.marginTop = "20px";
    document.body.appendChild(errorMessage);
  }
}

export { PongGame };
export { initPongGame };
