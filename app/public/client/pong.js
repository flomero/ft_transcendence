class PongGame {
  constructor(canvasId) {
    this.gameState = {};
    this.ratio = 0.0;
    this.isConnected = false;
    this.debug = false;
    this.rotationAngle = 0;
    this.padding = 20;
    this.playerIndex = -1;
    this.playerCount = 0;
    const path = window.location.pathname;
    this.gameId = path.split("/").pop() || "";
    if (!this.gameId) throw new Error("No gameId provided in URL parameters");
    this.canvas = document.getElementById(canvasId);
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
  setupWebSocket() {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/${this.gameId}`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = this.handleSocketOpen.bind(this);
    socket.onmessage = this.handleSocketMessage.bind(this);
    socket.onclose = this.handleSocketClose.bind(this);
    socket.onerror = this.handleSocketError.bind(this);
    return socket;
  }
  handleSocketOpen() {
    console.log("Connected to game WebSocket");
    this.isConnected = true;
  }
  handleSocketMessage(event) {
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
            this.ratio = (this.canvas.width - this.padding * 2) / 200.0;
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
  calculateRotationAngle() {
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
  handleSocketClose() {
    console.log("Game WebSocket closed");
    this.isConnected = false;
  }
  handleSocketError(error) {
    this.isConnected = false;
  }
  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }
  handleKeyDown(event) {
    let action = {
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
  handleKeyUp(event) {
    let action = {
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
  draw() {
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
    if (this.gameState.walls) this.drawWalls();
    if (this.gameState.modifiersState?.spawnedPowerUps) this.drawPowerUps();
    if (this.gameState.paddles) this.drawPaddles();
    if (this.gameState.balls) this.drawBalls();
    if (this.gameState.scores) {
      const rotated = shouldRotate || this.playerIndex === 1;
      this.drawScores(rotated);
    }
    this.ctx.restore();
    if (this.debug) this.drawDebugElements();
  }
  drawDebugElements() {
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
    this.ctx.fillText(
      `Player Index: ${this.playerIndex}, Rotation: ${this.rotationAngle.toFixed(2)} rad (${((this.rotationAngle * 180) / Math.PI).toFixed(2)}°)`,
      10,
      80,
    );
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
    const centerX = 750;
    const centerY = 50;
    const radius = 30;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "white";
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX - radius, centerY);
    this.ctx.strokeStyle = "gray";
    this.ctx.stroke();
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
  drawBalls() {
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
  drawPaddles() {
    if (!this.gameState.paddles) return;
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
  drawWalls() {
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
  drawPowerUps() {
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
  getPowerUpColor(type) {
    switch (type) {
      case "speedBoost":
        return "#ff0000";
      case "blinkingBall":
        return "#0000ff";
      case "multiball_modifier":
        return "#00ff00";
      case "grasping_vines_debuff_modifier":
        return "#ffff00";
      case "black_hole_debuff_modifier":
        return "#800080";
      case "carousel_debuff_modifier":
        return "#00ff00";
      case "shooting_modifier":
        return "#ffff00";
      default:
        return "#ff8800";
    }
  }
  drawScores(isRotated = false) {
    if (!this.gameState.scores) return;
    this.ctx.restore();
  }
  startGameLoop() {
    const gameLoop = () => {
      this.draw();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
  disconnect() {
    if (this.gameSocket && this.isConnected) {
      this.gameSocket.close();
    }
  }
  reconnect() {
    if (!this.isConnected) {
      this.gameSocket = this.setupWebSocket();
    }
  }
  drawNeonRectangle(x, y, width, height, color, angle = 0) {
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
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
    this.ctx.fillRect(-halfWidth, -halfHeight, width, height);
    this.ctx.lineJoin = "round";
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    this.ctx.shadowBlur = 8;
    this.ctx.strokeRect(-halfWidth, -halfHeight, width, height);
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = "#fff";
    this.ctx.strokeRect(-halfWidth, -halfHeight, width, height);
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
//# sourceMappingURL=pong.js.map
