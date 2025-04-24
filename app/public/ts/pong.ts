interface GameObject {
  x: number;
  y: number;
  isVisible: boolean;
}

interface CircularGameObject extends GameObject {
  radius: number;
}

interface RectangularGameObject extends GameObject {
  width: number;
  height: number;
}

interface MovableGameObject extends GameObject {
  dx: number;
  dy: number;
}

interface Ball extends CircularGameObject {}

interface PowerUp extends CircularGameObject {}

interface Wall extends RectangularGameObject, MovableGameObject {}

interface Paddle extends RectangularGameObject, MovableGameObject {
  alpha: number;
}

interface ModifiersData {
  spawnedPowerUps: [string, PowerUp][];
}

interface GameState {
  balls?: Ball[];
  paddles?: Paddle[];
  walls?: Wall[];
  scores?: Record<string, number>;
  modifiersState?: ModifiersData;
}

interface UserInputAction {
  type: string;
  options: {
    type: string | null;
    timestamp: number;
  };
}

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState = {};
  private ratio: number = 0.0;
  private gameId: string;
  private isConnected = false;
  private debug = true;
  private rotationAngle = 0;
  gameSocket: WebSocket;
  private currentUserId: string;
  private playerIndex = -1; // -1 means not determined yet
  private playerCount = 0;

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
    this.ratio = this.canvas.width / 100.0;

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
          this.playerIndex = message.referenceTable.indexOf(this.currentUserId);
          this.playerCount = message.referenceTable.length;
          if (this.playerCount == 2) {
            this.canvas.width = 800;
            this.canvas.height = 400;
            this.ratio = this.canvas.width / 200.0;
          }
          if (
            this.playerIndex >= 0 &&
            this.gameState.paddles &&
            this.gameState.paddles[this.playerIndex]
          ) {
            this.calculateRotationAngle();
          }
        }
      }
    } catch (error) {}
  }

  private calculateRotationAngle(): void {
    if (
      this.playerIndex < 0 ||
      !this.gameState.paddles ||
      !this.gameState.paddles[this.playerIndex]
    ) {
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
    let action: UserInputAction = {
      type: "userInput",
      options: {
        type: null,
        timestamp: Date.now(),
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
    let action: UserInputAction = {
      type: "userInput",
      options: {
        type: null,
        timestamp: Date.now(),
      },
    };

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      action.options.type = "STOP";
    } else if (event.key === "Space") {
      action.options.type = "SPACE_STOP";
    }

    if (action.options.type && this.isConnected) {
      this.gameSocket.send(JSON.stringify(action));
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Only apply rotation for multiplayer games and when player position is known
    const shouldRotate = this.playerCount > 2 && this.playerIndex >= 0;
    console.log(
      `Should rotate: ${shouldRotate}, Player Index: ${this.playerIndex}`,
    );

    if (shouldRotate) {
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.rotate(this.rotationAngle);
      this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    } else {
      // For classic Pong, keep the existing rotation logic
      const classicRotate = this.playerIndex === 1;
      if (classicRotate) {
        this.ctx.save();
        this.ctx.translate(this.canvas.width, this.canvas.height);
        this.ctx.rotate(Math.PI);
      }
    }

    if (this.gameState.balls) this.drawBalls();
    if (this.gameState.paddles) this.drawPaddles();
    if (this.gameState.walls) this.drawWalls();
    if (this.gameState.modifiersState?.spawnedPowerUps) this.drawPowerUps();

    if (this.gameState.scores) {
      const rotated = shouldRotate || this.playerIndex === 1;
      this.drawScores(rotated);
    }

    if (shouldRotate || this.playerIndex === 1) {
      this.ctx.restore();
    }
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

    const gameStateInfo = Object.keys(this.gameState).length
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
    if (
      this.playerIndex >= 0 &&
      this.gameState.paddles &&
      this.gameState.paddles[this.playerIndex]
    ) {
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
    if (!this.gameState.balls) return;

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
    if (!this.gameState.paddles) return;

    this.gameState.paddles.forEach((paddle, index) => {
      if (paddle.isVisible) {
        const angle = Math.atan2(paddle.dy, paddle.dx);
        const x = paddle.x * this.ratio;
        const y = paddle.y * this.ratio;
        const width = paddle.width * this.ratio;
        const height = paddle.height * this.ratio;

        const paddleColor = index === 0 ? "#ff00ff" : "#00ffff";

        this.drawNeonRectangle(x, y, width, height, paddleColor, angle);
      }
    });
  }

  private drawWalls(): void {
    if (!this.gameState.walls) return;

    this.gameState.walls.forEach((wall) => {
      if (wall.isVisible) {
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
    if (!this.gameState.modifiersState?.spawnedPowerUps) return;

    this.gameState.modifiersState.spawnedPowerUps.forEach((entry) => {
      const [type, powerUp] = entry;
      if (powerUp.isVisible) {
        this.ctx.fillStyle = this.getPowerUpColor(type);
        this.ctx.beginPath();
        this.ctx.arc(
          powerUp.x * this.ratio,
          powerUp.y * this.ratio,
          powerUp.radius * this.ratio,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      }
    });
  }

  private getPowerUpColor(type: string): string {
    switch (type) {
      case "speedBoost":
        return "#ff0000"; // red
      case "blinkingBall":
        return "#0000ff"; // blue
      case "multiball_modifier":
        return "#00ff00"; // green
      case "grasping_vines_debuff_modifier":
        return "#ffff00"; // yellow
      case "black_hole_debuff_modifier":
        return "#800080"; // purple
      case "carousel_debuff_modifier":
        return "#00ff00"; // lime
      case "shooting_modifier":
        return "#ffff00"; // yellow
      default:
        return "#ff8800"; // orange
    }
  }

  private drawScores(isRotated: boolean = false): void {
    if (!this.gameState.scores) return;
    // update scores

    this.ctx.restore();
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
    angle: number = 0,
  ): void {
    let r = 255,
      g = 255,
      b = 255;

    if (color && color.startsWith("#")) {
      if (color.length === 7) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      } else if (color.length === 4) {
        r = parseInt(color.charAt(1) + color.charAt(1), 16);
        g = parseInt(color.charAt(2) + color.charAt(2), 16);
        b = parseInt(color.charAt(3) + color.charAt(3), 16);
      }
    }

    r = isNaN(r) ? 255 : Math.max(0, Math.min(255, r));
    g = isNaN(g) ? 255 : Math.max(0, Math.min(255, g));
    b = isNaN(b) ? 255 : Math.max(0, Math.min(255, b));

    this.ctx.save();

    this.ctx.translate(x, y);
    if (angle) this.ctx.rotate(angle);

    this.ctx.lineJoin = "round";
    this.ctx.globalCompositeOperation = "lighter";

    const border = 1.5;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const drawGlowingLayer = (lineWidth: number, opacity: number) => {
      this.ctx.beginPath();
      this.ctx.moveTo(-halfWidth + border, -halfHeight);
      this.ctx.lineTo(halfWidth - border, -halfHeight);
      this.ctx.quadraticCurveTo(
        halfWidth - border,
        -halfHeight,
        halfWidth,
        -halfHeight + border,
      );
      this.ctx.lineTo(halfWidth, halfHeight - border);
      this.ctx.quadraticCurveTo(
        halfWidth,
        halfHeight - border,
        halfWidth - border,
        halfHeight,
      );
      this.ctx.lineTo(-halfWidth + border, halfHeight);
      this.ctx.quadraticCurveTo(
        -halfWidth + border,
        halfHeight,
        -halfWidth,
        halfHeight - border,
      );
      this.ctx.lineTo(-halfWidth, -halfHeight + border);
      this.ctx.quadraticCurveTo(
        -halfWidth,
        -halfHeight + border,
        -halfWidth + border,
        -halfHeight,
      );
      this.ctx.closePath();

      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      this.ctx.stroke();
    };

    this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowBlur = 10;

    drawGlowingLayer(7.5, 0.2);
    drawGlowingLayer(6, 0.2);
    drawGlowingLayer(4.5, 0.2);
    drawGlowingLayer(3, 0.2);

    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = "#fff";
    this.ctx.shadowBlur = 0;
    drawGlowingLayer(1.5, 1);

    this.ctx.restore();
  }
}

function initPongGame() {
  try {
    if (document.getElementById("gameCanvas")) {
      return new PongGame("gameCanvas");
    } else {
      throw new Error("Canvas element with id 'gameCanvas' not found");
    }
  } catch (error) {
    const errorMessage = document.createElement("div");
    errorMessage.textContent = "Error initializing Pong game: " + error;
    errorMessage.style.color = "red";
    errorMessage.style.fontSize = "20px";
    errorMessage.style.textAlign = "center";
    errorMessage.style.marginTop = "20px";
    document.body.appendChild(errorMessage);
  }
}

export { PongGame };
export { initPongGame };
