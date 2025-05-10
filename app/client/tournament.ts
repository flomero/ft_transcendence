import type { Edge, Round } from "../types/tournament/tournament";
import type Router from "./router.js";

type Rounds = Round[];

type Connections =
  | { auto: true; edges: never[] }
  | { auto: false; edges: Edge[] };

declare global {
  interface Window {
    __ROUNDS__: Rounds;
    __CONNECTIONS__: Connections;
    tournamentBracket?: TournamentBracket;
    drawTournamentLines?: () => void;

    TournamentBracket: typeof TournamentBracket;
    tournamentHandler: TournamentHandler;
    router: Router;
  }
}

class TournamentBracket {
  private rounds: Rounds;
  private connections: Connections;
  private edges: Edge[];
  private svg: SVGSVGElement;
  private bracket: HTMLElement;

  constructor() {
    this.rounds = window.__ROUNDS__;
    this.connections = window.__CONNECTIONS__;
    this.svg = document.querySelector<SVGSVGElement>("#lines")!;
    this.bracket = document.querySelector<HTMLElement>("#bracket")!;

    this.edges = this.connections.auto
      ? this.buildAutoEdges()
      : this.connections.edges;

    this.drawLines = this.drawLines.bind(this);
    this.init();
  }

  private buildAutoEdges(): Edge[] {
    console.log("Building auto edges");
    const list: Edge[] = [];
    for (let r = 0; r < this.rounds.length - 1; r++) {
      const currentMatches = this.rounds[r].matches;
      const nextMatches = this.rounds[r + 1].matches;

      currentMatches.forEach((match, i) => {
        const target = nextMatches[Math.floor(i / 2)];
        if (match.id && target.id) {
          list.push([match.id, target.id]); // no offset (defaults to 0)
        } else {
          console.error("Match or target ID is undefined", { match, target });
        }
      });
    }
    return list;
  }

  private init(): void {
    this.drawLines();
    window.addEventListener("resize", this.drawLines);
    window.drawTournamentLines = this.drawLines;
  }

  public destroy(): void {
    window.removeEventListener("resize", this.drawLines);
    window.drawTournamentLines = undefined;
  }

  private drawLines(): void {
    console.log("Drawing Lines");
    console.log("Edges", this.edges);
    console.log(this.connections.auto);

    const box = this.bracket.getBoundingClientRect();
    this.svg.setAttribute("width", `${box.width}`);
    this.svg.setAttribute("height", `${box.height}`);
    this.svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    this.svg.innerHTML = "";

    this.edges.forEach((edge) => {
      const [from, to, offset = 0] = edge;

      const a = document.getElementById(from)!.getBoundingClientRect();
      const b = document.getElementById(to)!.getBoundingClientRect();

      const x1 = a.right - box.left;
      const y1 = a.top - box.top + a.height / 2;
      const x2 = b.left - box.left;
      const y2 = b.top - box.top + b.height / 2;
      const midX = (x1 + x2) / 2 + offset;

      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", `M${x1},${y1} H${midX} V${y2} H${x2}`);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#999");
      p.setAttribute("stroke-width", "2");
      this.svg.appendChild(p);
    });
  }
}

class TournamentHandler {
  public socket: WebSocket | null = null;

  private getTournamentId(): string {
    return document.location.pathname.split("/").pop() || "";
  }

  public connect(): void {
    console.log("Connecting to tournament...");
    const tournamentId = window.location.pathname.split("/").pop();
    if (!tournamentId) {
      console.error("Tournament ID not found in URL");
      return;
    }

    this.socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/tournament/${tournamentId}`,
    );

    this.socket.onopen = () => {
      console.log("Tournament WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.socket.onclose = () => {
      console.log("Tournament WebSocket disconnected");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleMessage(message: any): void {
    console.log("Received tournament message:", message);

    switch (message.type) {
      case "error":
        this.handleError(message.data);
        break;
      case "update":
        this.refreshView();
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private refreshView(): void {
    window.router.refresh(); // TODO: maybe make better
  }

  public leaveTournament(event: Event): void {
    event.preventDefault();
    fetch(
      `/games/tournament/leave/${window.location.pathname.split("/").pop()}`,
      {
        method: "POST",
      },
    ).then(() => {
      window.location.href = "/play";
    });
  }

  public async addAiOpponent(): Promise<void> {
    try {
      const response = await fetch(
        `/games/tournament/add-ai-opponent/${this.getTournamentId()}`,
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

  public async startTournament(): Promise<void> {
    try {
      const response = await fetch(
        `/games/tournament/start/${this.getTournamentId()}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to start Tournament: ${response.statusText}`);
      }

      // const data = await response.json();
      // TODO: what happens here???
      console.log("Tournament started");
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      } else {
        this.handleError(
          new Error("Failed to start tournament. Please try again later."),
        );
      }
    }
  }

  private handleError(error: Error): void {
    const errorEl = document.getElementById("tournament-error");
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
    }
  }
}
export { TournamentHandler, TournamentBracket };
