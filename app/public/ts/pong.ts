// Game object interfaces
interface Ball {
  x: number;
  y: number;
  radius: number;
  isVisible: boolean;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  isVisible: boolean;
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  isVisible: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  radius: number;
  isVisible: boolean;
}

interface ModifiersData {
  spawnedPowerUps: [string, PowerUp][];
}

interface GameState {
  balls?: Ball[];
  paddles?: Paddle[];
  walls?: Wall[];
  scores?: Record<string, number>;
  modifiersData?: ModifiersData;
}

interface UserInputAction {
  type: string;
  options: {
    type: string | null;
    timestamp: number;
  };
}

type GameMode = "classicPong" | "multiplayerPong";

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState = {};
  private ratio: number = 0.0;
  private gameMode: GameMode;
  private gameId: string;
  private isConnected: boolean = false;
  gameSocket: WebSocket;

  constructor(canvasId: string) {
    const path = window.location.pathname;
    this.gameId = path.split("/").pop() || "";
    if (!this.gameId) throw new Error("No gameId provided in URL parameters");
    const urlParams = new URLSearchParams(window.location.search);
    this.gameMode = (urlParams.get("gameMode") as GameMode) || "classicPong";
    if (!this.gameMode)
      throw new Error("No gameMode provided in URL parameters");

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context from canvas");
    this.ctx = context;

    this.setupCanvasDimensions();

    this.gameSocket = this.setupWebSocket();

    this.setupEventListeners();

    this.startGameLoop();
  }

  private setupCanvasDimensions(): void {
    if (this.gameMode === "multiplayerPong") {
      this.canvas.width = 800;
      this.canvas.height = 800;
      this.ratio = this.canvas.width / 100.0;
    } else {
      this.canvas.width = 800;
      this.canvas.height = 400;
      this.ratio = this.canvas.width / 200.0;
    }
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
        this.gameState = JSON.parse(message.data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  private handleSocketClose(): void {
    console.log("Game WebSocket closed");
    this.isConnected = false;
  }

  private handleSocketError(error: Event): void {
    console.error("WebSocket error:", error);
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
    }

    if (action.options.type && this.isConnected) {
      this.gameSocket.send(JSON.stringify(action));
    }
  }

  private draw(): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw debug background - always visible
    this.drawDebugElements();

    if (this.gameState.balls) this.drawBalls();
    if (this.gameState.paddles) this.drawPaddles();
    if (this.gameState.walls) this.drawWalls();
    if (this.gameState.modifiersData?.spawnedPowerUps) this.drawPowerUps();
    if (this.gameState.scores) this.drawScores();
  }

  // New method to draw debug elements and canvas boundaries
  private drawDebugElements(): void {
    // Draw canvas border to visualize boundaries
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    // Display debug info on screen
    this.ctx.fillStyle = "white";
    this.ctx.font = "14px ui-sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      `Game Mode: ${this.gameMode}, Connected: ${this.isConnected}`,
      10,
      20,
    );
    this.ctx.fillText(
      `Canvas: ${this.canvas.width}x${this.canvas.height}, Ratio: ${this.ratio.toFixed(2)}`,
      10,
      40,
    );

    const gameStateInfo = Object.keys(this.gameState).length
      ? `Game objects: ${Object.keys(this.gameState).join(", ")}`
      : "No game state received yet";
    this.ctx.fillText(gameStateInfo, 10, 60);
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

    this.gameState.paddles.forEach((paddle) => {
      if (paddle.isVisible) {
        this.ctx.fillStyle = "white";
        this.ctx.save();

        this.ctx.translate(paddle.x * this.ratio, paddle.y * this.ratio);
        const angle = Math.atan2(paddle.dy, paddle.dx);
        this.ctx.rotate(angle);

        this.ctx.fillRect(
          -(paddle.width * this.ratio) / 2,
          -(paddle.height * this.ratio) / 2,
          paddle.width * this.ratio,
          paddle.height * this.ratio,
        );

        this.ctx.restore();
      }
    });
  }

  private drawWalls(): void {
    if (!this.gameState.walls) return;

    this.gameState.walls.forEach((wall) => {
      if (wall.isVisible) {
        this.ctx.save();
        this.ctx.translate(wall.x * this.ratio, wall.y * this.ratio);
        const angle = Math.atan2(wall.dy, wall.dx);
        this.ctx.rotate(angle);

        this.ctx.strokeStyle = "red";
        this.ctx.strokeRect(
          (-wall.width * this.ratio) / 2,
          (-wall.height * this.ratio) / 2,
          wall.width * this.ratio,
          wall.height * this.ratio,
        );

        this.ctx.restore();
      }
    });
  }

  private drawPowerUps(): void {
    if (!this.gameState.modifiersData?.spawnedPowerUps) return;

    this.gameState.modifiersData.spawnedPowerUps.forEach((entry) => {
      const type = entry[0];
      const powerUp = entry[1];

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
        return "red";
      case "blinkingBall":
        return "blue";
      case "multiball_modifier":
        return "green";
      case "grasping_vines_debuff_modifier":
        return "yellow";
      case "black_hole_debuff_modifier":
        return "purple";
      case "carousel_debuff_modifier":
        return "lime";
      case "shooting_modifier":
        return "yellow";
      default:
        return "orange";
    }
  }

  private drawScores(): void {
    if (!this.gameState.scores) return;

    this.ctx.fillStyle = "white";
    this.ctx.font = "24px ui-sans-serif";
    this.ctx.textAlign = "center";

    this.ctx.fillText(
      `Scores: ${JSON.stringify(this.gameState.scores)}`,
      this.canvas.width / 2,
      30,
    );
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
