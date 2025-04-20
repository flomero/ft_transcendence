export {};

type Match = { id: string; teamA: string; teamB: string };
type Round = Match[];
type Rounds = Round[];

type Connections =
  | { auto: true; edges: never[] }
  | { auto: false; edges: [string, string][] };

declare global {
  interface Window {
    __ROUNDS__: Rounds;
    __CONNECTIONS__: Connections;
    tournamentBracket?: TournamentBracket;
    drawTournamentLines?: () => void; // Marked as optional

    TournamentBracket: typeof TournamentBracket;
  }
}

class TournamentBracket {
  private rounds: Rounds;
  private connections: Connections;
  private edges: [string, string][];
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

  private buildAutoEdges(): [string, string][] {
    console.log("Building auto edges");
    const list: [string, string][] = [];
    for (let r = 0; r < this.rounds.length - 1; r++) {
      this.rounds[r].forEach((match, i) => {
        const target = this.rounds[r + 1][Math.floor(i / 2)];
        list.push([match.id, target.id]);
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
    delete window.drawTournamentLines;
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

    this.edges.forEach(([from, to]) => {
      const a = document.getElementById(from)!.getBoundingClientRect();
      const b = document.getElementById(to)!.getBoundingClientRect();

      const x1 = a.right - box.left;
      const y1 = a.top - box.top + a.height / 2;
      const x2 = b.left - box.left;
      const y2 = b.top - box.top + b.height / 2;
      const midX = (x1 + x2) / 2;

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
