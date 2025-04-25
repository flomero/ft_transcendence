class LobbyHandler {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }
  getLobbyId() {
    return document.location.pathname.split("/").pop() || "";
  }
  connect() {
    if (this.isConnected) return;
    this.socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/lobby/${this.getLobbyId()}`,
    );
    this.socket.onopen = () => {
      this.isConnected = true;
      console.log("Lobby WebSocket connected");
    };
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {}
    };
    this.socket.onclose = () => {
      this.isConnected = false;
      console.log("Lobby WebSocket closed");
    };
    this.socket.onerror = (error) => {
      window.router.refresh();
    };
  }
  handleMessage(message) {
    console.log("Received lobby message:", message);
    switch (message.type) {
      case "memberJoined":
        this.handleMemberJoined(message.data);
        break;
      case "memberLeft":
        this.handleMemberLeft(message.data);
        break;
      case "memberReady":
        this.handleMemberReady(message.data);
        break;
      case "allReady":
        this.handleAllReady();
        break;
      case "gameStarted":
        this.handleGameStart(message.data);
        break;
      case "addedAI":
        this.handleMemberJoined(message.data);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }
  handleMemberJoined(memberId) {
    this.refreshLobby();
  }
  handleMemberLeft(memberId) {
    this.refreshLobby();
  }
  handleMemberReady(data) {
    this.refreshLobby();
  }
  handleGameStart(gameId) {
    window.router.navigateTo(`/play/game/${gameId}`);
  }
  handleAllReady() {
    console.log("All members are ready!");
    const startButton = document.getElementById("start-lobby-button");
    if (startButton) {
      startButton.classList.remove("opacity-50", "cursor-not-allowed");
      startButton.removeAttribute("disabled");
    }
  }
  async toggleReadyState(isReady) {
    try {
      const response = await fetch(
        `/games/lobby/ready/${this.getLobbyId()}/${isReady}`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to set ready state: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      }
      return false;
    }
  }
  async setReady(event) {
    const button = event.target;
    const success = await this.toggleReadyState(true);
    if (success && button) {
      button.style.display = "none";
    }
    return success;
  }
  async addAiOpponent() {
    try {
      const response = await fetch(
        `/games/lobby/add-ai-opponent/${this.getLobbyId()}`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const msg = await response.text();
        const data = JSON.parse(msg);
        throw new Error(
          data?.message || `Failed to add AI opponent: ${response.statusText}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      } else {
        this.handleError(
          new Error("Failed to add AI opponent. Please try again later."),
        );
      }
    }
  }
  async unsetReady() {
    this.toggleReadyState(false);
  }
  async startLobby() {
    try {
      const response = await fetch(`/games/lobby/start/${this.getLobbyId()}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to start game: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Lobby started, game ID:", data.gameId);
    } catch (error) {
      this.handleError(
        new Error("Failed to start game. Please try again later."),
      );
    }
  }
  async leaveLobby() {
    try {
      const response = await fetch(`/games/lobby/leave/${this.getLobbyId()}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to leave lobby: ${response.statusText}`);
      }
      if (this.socket) {
        this.socket.close();
      }
      window.router.navigateTo("/play");
    } catch (error) {
      this.handleError(
        new Error("Failed to leave lobby. Please try again later."),
      );
    }
  }
  refreshLobby() {
    window.router.refresh();
  }
  handleError(error) {
    const errorEl = document.getElementById("lobby-error");
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
    }
  }
}
export default LobbyHandler;
//# sourceMappingURL=lobby.js.map
