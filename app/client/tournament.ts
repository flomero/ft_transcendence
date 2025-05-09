import type { Edge, TournamentInfos } from "../types/tournament/tournament";

type Connections =
  | { auto: true; edges: never[] }
  | { auto: false; edges: Edge[] };

declare global {
  interface Window {
    __TOURNAMENTS__: TournamentInfos[];
    __CONNECTIONS__: Connections;
    tournamentBracket?: TournamentBracket;
    drawTournamentLines?: () => void;
    TournamentBracket: typeof TournamentBracket;
  }
}

class TournamentBracket {
  /* ---------- state ---------- */
  private tournaments: TournamentInfos[];
  private connections: Connections;
  private edges: Edge[];

  private svg: SVGSVGElement;
  private bracket: HTMLElement;

  private timerInterval: number | null = null;
  private resizeObserver!: ResizeObserver;

  /* ---------- bootstrap ---------- */
  constructor() {
    /* the server now exposes tournaments instead of plain rounds */
    this.tournaments = window.__TOURNAMENTS__;
    this.connections = window.__CONNECTIONS__;

    this.bracket = document.querySelector<HTMLElement>("#bracket")!;
    this.svg = this.bracket.querySelector<SVGSVGElement>("#lines")!;

    /* build the edge list once */
    this.edges = this.connections.auto
      ? this.buildAutoEdges()
      : this.connections.edges;

    /* make sure `this` is preserved when used as a callback */
    this.drawLines = this.drawLines.bind(this);

    this.init();
  }

  /* ---------- edge helpers ---------- */
  /**
   * Auto-generate edges for **every** tournament that was rendered
   * (classic «winner-moves-on» single-elimination pairing).
   */
  private buildAutoEdges(): Edge[] {
    const list: Edge[] = [];

    this.tournaments.forEach((tournament) => {
      const rounds = tournament.rounds;

      for (let r = 0; r < rounds.length - 1; r++) {
        const currentMatches = rounds[r].matches;
        const nextMatches = rounds[r + 1].matches;

        currentMatches.forEach((match, i) => {
          const target = nextMatches[Math.floor(i / 2)];

          if (match.id && target.id) {
            list.push([tournament.id, match.id, target.id]);
          }
        });
      }
    });

    return list;
  }

  /* ---------- timers ---------- */
  private updateElapsedTime(element: Element) {
    const startTime = element.getAttribute("data-start");
    if (!startTime) return;

    const diff = Math.floor(
      (Date.now() - new Date(startTime).getTime()) / 1000,
    );
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    element.textContent = `${h ? `${h}h ` : ""}${m ? `${m}m ` : ""}${s}s`;
  }

  private startLiveTimers() {
    const tick = () =>
      document
        .querySelectorAll(".elapsed-time")
        .forEach((el) => this.updateElapsedTime(el));

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(tick, 1000);
    tick();
  }

  /* ---------- lifecycle ---------- */
  private init() {
    this.drawLines();

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

  /* ---------- SVG rendering ---------- */
  private drawLines() {
    const width = this.bracket.scrollWidth;
    const height = this.bracket.scrollHeight;

    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = "";

    const bracketBox = this.bracket.getBoundingClientRect();

    this.edges.forEach(([tid, from, to, offset = 0]) => {
      const fromId = `${tid}-${from}`;
      const toId = `${tid}-${to}`;

      const aEl = document.getElementById(fromId);
      const bEl = document.getElementById(toId);
      if (!aEl || !bEl) return; // element missing → skip

      const aBox = aEl.getBoundingClientRect();
      const bBox = bEl.getBoundingClientRect();

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
