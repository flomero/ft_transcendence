import type { Edge, TournamentInfos } from "../types/tournament/tournament";
import type Router from "./router.js";

declare global {
  interface Window {
    __TOURNAMENTS__: TournamentInfos[];

    /* optional helpers the app sets/clears elsewhere */
    tournamentBracket?: TournamentBracket;
    drawTournamentLines?: () => void;
    TournamentBracket: typeof TournamentBracket;
    tournamentHandler: TournamentHandler;
    router: Router;
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
