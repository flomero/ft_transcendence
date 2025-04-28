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

  private resizeObserver!: ResizeObserver;

  constructor() {
    this.rounds = window.__ROUNDS__;
    this.connections = window.__CONNECTIONS__;

    this.bracket = document.querySelector<HTMLElement>("#bracket")!;
    this.svg = this.bracket.querySelector<SVGSVGElement>("#lines")!;

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

  private init() {
    this.drawLines();

    // redraw when the window resizes OR the bracket itself grows/shrinks
    window.addEventListener("resize", this.drawLines);
    this.resizeObserver = new ResizeObserver(this.drawLines);
    this.resizeObserver.observe(this.bracket);

    window.drawTournamentLines = this.drawLines;
    this.startLiveTimers();
  }

  public destroy() {
    window.removeEventListener("resize", this.drawLines);
    this.resizeObserver.disconnect();
    window.drawTournamentLines = undefined;
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private drawLines() {
    const width = this.bracket.scrollWidth;
    const height = this.bracket.scrollHeight;

    // style.width/height overrule Tailwind’s w-full/h-full
    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = "";

    const bracketBox = this.bracket.getBoundingClientRect();

    this.edges.forEach(([from, to, offset = 0]) => {
      const aBox = document.getElementById(from)!.getBoundingClientRect();
      const bBox = document.getElementById(to)!.getBoundingClientRect();

      const x1 = aBox.right - bracketBox.left;
      const y1 = aBox.top - bracketBox.top + aBox.height / 2;
      const x2 = bBox.left - bracketBox.left;
      const y2 = bBox.top - bracketBox.top + bBox.height / 2;
      const midX = (x1 + x2) / 2 + offset;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", `M${x1},${y1} H${midX} V${y2} H${x2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#999");
      path.setAttribute("stroke-width", "2");
      this.svg.appendChild(path);
    });
  }
}

export default TournamentBracket;
