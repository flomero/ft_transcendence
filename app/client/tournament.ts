import type { Edge, Round } from "../types/tournament/tournament";

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
        this.displayError(message.data);
        break;
      case "update":
        this.updateTournament(message.data);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private displayError(errorMessage: string): void {
    const errorElement = document.getElementById("tournament-error");
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.style.display = "block";
    }
  }

  private updateTournament(data: any): void {
    const container = document.getElementById("tournament-container");
    if (container) {
      container.innerHTML = data.html;
    }
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

  public setReady(): void {
    fetch(
      `/games/tournament/ready/${window.location.pathname.split("/").pop()}/true`,
      {
        method: "POST",
      },
    );
  }

  public addAiOpponent(): void {
    fetch(
      `/games/tournament/add-ai/${window.location.pathname.split("/").pop()}`,
      {
        method: "POST",
      },
    );
  }

  public startTournament(): void {
    fetch(
      `/games/tournament/start/${window.location.pathname.split("/").pop()}`,
      {
        method: "POST",
      },
    );
  }
}
export { TournamentHandler, TournamentBracket };
