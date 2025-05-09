import type { Edge, TournamentInfos } from "../types/tournament/tournament";

declare global {
  interface Window {
    __TOURNAMENTS__: TournamentInfos[];

    /* optional helpers the app sets/clears elsewhere */
    tournamentBracket?: TournamentBracket;
    drawTournamentLines?: () => void;
    TournamentBracket: typeof TournamentBracket;
  }
}

class TournamentBracket {
  /* ---------- state ---------- */
  private readonly tournaments: TournamentInfos[];
  private readonly edges: Edge[];

  private readonly svg: SVGSVGElement;
  private readonly bracket: HTMLElement;

  private timerInterval: number | null = null;
  private resizeObserver!: ResizeObserver;

  /* ---------- bootstrap ---------- */
  constructor() {
    /* server now ships fully-hydrated tournaments with .seeding in place */
    this.tournaments = window.__TOURNAMENTS__;

    this.bracket = document.querySelector<HTMLElement>("#bracket")!;
    this.svg = this.bracket.querySelector<SVGSVGElement>("#lines")!;

    /* collect every edge from every tournament */
    this.edges = this.tournaments.flatMap((t) => t.seeding ?? []);

    /* make sure `this` survives when used as a callback */
    this.drawLines = this.drawLines.bind(this);

    this.init();
  }

  /* ---------- timers ---------- */
  private updateElapsedTime(el: Element) {
    const start = el.getAttribute("data-start");
    if (!start) return;

    const diff = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    el.textContent = `${h ? `${h}h ` : ""}${m ? `${m}m ` : ""}${s}s`;
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
    console.log("Drawing tournament lines...");
    console.dir(this.edges, { depth: null });
    const width = this.bracket.scrollWidth;
    const height = this.bracket.scrollHeight;

    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = "";

    const bracketBox = this.bracket.getBoundingClientRect();

    /* seeding edges already have the form [tid, fromId, toId, offset?] */
    this.edges.forEach(([tid, from, to, offset = 0]) => {
      const fromId = `${tid}-${from}`;
      const toId = `${tid}-${to}`;

      console.log(`drawing tournament lines for ${fromId}`);
      console.log(`drawing tournament lines for ${toId}`);

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
