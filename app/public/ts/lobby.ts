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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: any;
}

class LobbyHandler {
  private socket: WebSocket | null = null;
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
    };

    this.socket.onmessage = (event) => {
      try {
        const message: LobbyMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {}
    };

    this.socket.onclose = () => {
      this.isConnected = false;
    };

    this.socket.onerror = (error) => {};
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
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private handleMemberJoined(memberId: string): void {
    console.log("Member joined:", memberId);
    // Refresh the lobby UI or add the new member to the display
    this.refreshLobby();
  }

  private handleMemberLeft(memberId: string): void {
    console.log("Member left:", memberId);
    // Refresh the lobby UI or remove the member from the display
    this.refreshLobby();
  }

  private handleMemberReady(data: { memberId: string }): void {
    console.log("Member ready status changed:", data.memberId);
    // Update the ready status in the UI
    this.refreshLobby();
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

  public async unsetReady(): Promise<void> {
    this.toggleReadyState(false);
  }

  public async startLobby(): Promise<void> {
    try {
      const response = await fetch(`/games/lobby/start/${this.getLobbyId()}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to start lobby: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Lobby started, game ID:", data.gameId);
    } catch (error) {
      console.error("Error starting lobby:", error);
    }
  }

  public async leaveLobby(): Promise<void> {
    console.log("leaving");
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

      window.location.href = "/play";
    } catch (error) {
      console.error("Error leaving lobby:", error);
    }
  }

  private refreshLobby(): void {
    window.router.refresh(); // TODO: maybe make better
  }
}

function initializeLobbyHandler() {
  const lobbyHandler = new LobbyHandler();
  lobbyHandler.connect();
  window.lobbyHandler = lobbyHandler;
  console.log("LobbyHandler initialized");
}

// Observe changes in the DOM
const observer = new MutationObserver(() => {
  const lobbyContainer = document.getElementById("lobby-container");
  if (lobbyContainer) {
    initializeLobbyHandler();
  }
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
