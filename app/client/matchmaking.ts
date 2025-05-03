import type Router from "./router.js";

declare global {
  interface Window {
    router: Router;
    MatchmakingHandler: typeof MatchmakingHandler;
    matchmakingHandler: MatchmakingHandler;
  }
}

interface MatchmakingMessage {
  type: string;
  data: any;
}

class MatchmakingHandler {
  public socket: WebSocket | null = null;
  private isConnected = false;

  public connect(): void {
    console.log("Connecting to matchmaking...");
    if (this.isConnected) return;

    this.socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/matchmaking`,
    );

    this.socket.onopen = () => {
      this.isConnected = true;
      console.log("Matchmaking WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      const message: MatchmakingMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.socket.onclose = () => {
      this.isConnected = false;
    };

    this.socket.onerror = (error) => {
      this.handleError("WebSocket error: " + error);
    };
  }

  private handleMessage(message: MatchmakingMessage): void {
    console.log("Received matchmaking message:", message);

    switch (message.type) {
      case "error":
        this.handleError(message.data);
        break;
      case "matchFound":
        this.handleMatchFound(message.data);
        break;
      case "updateText":
        const matchmakingStatusElement =
          document.getElementById("matchmaking-status");
        if (matchmakingStatusElement) {
          matchmakingStatusElement.textContent = message.data;
        }
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private handleError(errorMessage: string): void {
    const errorElement = document.getElementById("matchmaking-error");
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.style.display = "block";
    }
  }

  private handleMatchFound(gameId: string): void {
    window.router.navigateTo(`/play/game/${gameId}`);
  }

  public async cancelMatchmaking(): Promise<void> {
    try {
      const response = await fetch("/games/matchmaking/leave/", {
        method: "POST",
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        this.handleError("Failed to leave matchmaking");
      }
    } catch (error) {
      this.handleError("Network error: " + error);
    } finally {
      if (this.socket) {
        this.socket.close();
        this.isConnected = false;
      }
      window.router.navigateTo("/play");
    }
  }
}

export default MatchmakingHandler;
