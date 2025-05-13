import type Router from "./router.js";

declare global {
  interface Window {
    router: Router;
    LobbyHandler: typeof LobbyHandler;
    lobbyHandler: LobbyHandler;
  }
}

interface LobbyMessage {
  type: string;
  data: any;
}

class LobbyHandler {
  public socket: WebSocket | null = null;
  private isConnected = false;

  private getLobbyId(): string {
    return document.location.pathname.split("/").pop() || "";
  }

  public connect(): void {
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
        const message: LobbyMessage = JSON.parse(event.data);
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

  private handleMessage(message: LobbyMessage): void {
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
      case "disconnect":
        this.handleClose();
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private handleMemberJoined(memberId: string): void {
    // Refresh the lobby UI or add the new member to the display
    this.refreshLobby();
  }

  private handleMemberLeft(memberId: string): void {
    // Refresh the lobby UI or remove the member from the display
    this.refreshLobby();
  }

  private handleMemberReady(data: { memberId: string }): void {
    // Update the ready status in the UI
    this.refreshLobby();
  }

  private handleGameStart(gameId: string): void {
    window.router.navigateTo(`/play/game/${gameId}`);
  }

  private handleClose(): void {
    window.router.navigateTo("/play");
  }

  private handleAllReady(): void {
    console.log("All members are ready!");
    const startButton = document.getElementById("start-lobby-button");
    if (startButton) {
      startButton.classList.remove("opacity-50", "cursor-not-allowed");
      startButton.removeAttribute("disabled");
    }
  }

  private async toggleReadyState(isReady: boolean): Promise<boolean> {
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

  public async setReady(event: Event): Promise<boolean> {
    const button = event.target as HTMLElement;
    const success = await this.toggleReadyState(true);

    if (success && button) {
      button.style.display = "none";
    }

    return success;
  }

  public async addAiOpponent(): Promise<void> {
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

  public async addLocalPlayer(): Promise<void> {
    try {
      const response = await fetch(
        `/games/lobby/add-local-player/${this.getLobbyId()}`,
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

  public async unsetReady(): Promise<void> {
    this.toggleReadyState(false);
  }

  public async startLobby(): Promise<void> {
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

  public async leaveLobby(): Promise<void> {
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

  private refreshLobby(): void {
    window.router.refresh(); // TODO: maybe make better
  }

  private handleError(error: Error): void {
    const errorEl = document.getElementById("lobby-error");
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
    }
  }
}

export default LobbyHandler;
