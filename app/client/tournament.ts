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
  }
}

class TournamentBracket {
  private rounds: Rounds;
  private connections: Connections;
  private edges: Edge[];
  private svg: SVGSVGElement;
  private bracket: HTMLElement;
  private timerInterval: number | null = null;

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
          list.push([match.id, target.id]);
        } else {
          console.error("Match or target ID is undefined", { match, target });
        }
      });
    }
    return list;
  }

  private updateElapsedTime(element: Element) {
    const startTime = element.getAttribute("data-start");
    if (!startTime) return;

    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diffInSeconds = Math.floor((now - start) / 1000);
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    const formattedHours = hours > 0 ? `${hours}h ` : "";
    const formattedMinutes = minutes > 0 ? `${minutes}m ` : "";
    const formattedSeconds = `${seconds}s`;

    element.textContent = `${formattedHours}${formattedMinutes}${formattedSeconds}`;
  }

  private startLiveTimers() {
    const updateAllTimers = () => {
      document
        .querySelectorAll(".elapsed-time")
        .forEach((element) => this.updateElapsedTime(element));
    };

    // Clear existing interval if any
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Update every second
    this.timerInterval = window.setInterval(updateAllTimers, 1000);
    // Initial update
    updateAllTimers();
  }

  private init(): void {
    this.drawLines();
    window.addEventListener("resize", this.drawLines);
    window.drawTournamentLines = this.drawLines;
    this.startLiveTimers();
  }

  public destroy(): void {
    window.removeEventListener("resize", this.drawLines);
    window.drawTournamentLines = undefined;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
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

export default TournamentBracket;
