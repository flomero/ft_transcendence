import type { Edge, TournamentInfos } from "../types/tournament/tournament";
import type Router from "./router.js";
import type { TournamentMessage } from "../types/tournament/tournament";

/* -------------------------------------------------------------------
   Window globals
------------------------------------------------------------------- */
declare global {
  interface Window {
    /** server-side hydrated tournament data */
    __TOURNAMENTS__: TournamentInfos[];

    /* optional helpers the app sets/clears elsewhere */
    tournamentBracket?: TournamentBracket;
    elapsedTimer?: ElapsedTimer; //  ← NEW
    drawTournamentLines?: () => void;
    TournamentBracket: typeof TournamentBracket;
    ElapsedTimer: typeof ElapsedTimer;
    tournamentHandler: TournamentHandler;
    router: Router;
  }
}

/* -------------------------------------------------------------------
   Elapsed-time handling (split out, logic unchanged)
------------------------------------------------------------------- */
class ElapsedTimer {
  private timerInterval: number | null = null;

  static create(): ElapsedTimer {
    const t = new ElapsedTimer();
    t.start();
    return t;
  }

  private updateElapsedTime(el: Element) {
    const start = el.getAttribute("data-start");
    if (!start) return;

    const diff = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    el.textContent = `${h ? `${h}h ` : ""}${m ? `${m}m ` : ""}${s}s`;
  }

  private tick = () => {
    Array.from(document.querySelectorAll(".elapsed-time")).forEach((el) => {
      this.updateElapsedTime(el);
    });
  };

  private start() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(this.tick, 1000);
    this.tick();
  }

  public destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
}

/* -------------------------------------------------------------------
   Tournament bracket (identical except timers removed)
------------------------------------------------------------------- */
class TournamentBracket {
  /* ---------- state ---------- */
  private readonly tournaments: TournamentInfos[];
  private readonly edges: Edge[];

  private svg: SVGSVGElement | null = null;
  private bracket: HTMLElement | null = null;

  private resizeObserver: ResizeObserver | null = null;

  /* ---------- bootstrap ---------- */
  constructor() {
    /* server now ships fully-hydrated tournaments with .seeding in place */
    this.tournaments = window.__TOURNAMENTS__;

    // if (!this.tournaments || this.tournaments.length === 0) {
    //   return;
    // }
    /* collect every edge from every tournament */
    this.edges = this.tournaments.flatMap((t) => t.seeding ?? []);

    /* make sure `this` survives when used as a callback */
    this.drawLines = this.drawLines.bind(this);
  }

  /* Create and initialize a new tournament bracket when DOM is ready */
  public static create(): TournamentBracket {
    const bracket = new TournamentBracket();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => bracket.init());
    } else {
      bracket.init();
    }

    return bracket;
  }

  /* ---------- lifecycle ---------- */
  private init() {
    // Find DOM elements now that we're sure they exist
    this.bracket = document.querySelector<HTMLElement>("#bracket");
    this.svg = this.bracket?.querySelector<SVGSVGElement>("#lines") || null;

    if (!this.bracket || !this.svg) {
      return;
    }

    this.drawLines();

    window.addEventListener("resize", this.drawLines);
    this.resizeObserver = new ResizeObserver(this.drawLines);
    this.resizeObserver.observe(this.bracket);

    window.drawTournamentLines = this.drawLines;
  }

  public destroy() {
    window.removeEventListener("resize", this.drawLines);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.drawTournamentLines = undefined;
  }

  /* ---------- SVG rendering ---------- */
  private drawLines() {
    if (!this.bracket || !this.svg) return;

    const width = this.bracket.scrollWidth;
    const height = this.bracket.scrollHeight;

    this.svg.style.width = `${width}px`;
    this.svg.style.height = `${height}px`;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = "";

    const bracketBox = this.bracket.getBoundingClientRect();

    /* seeding edges already have the form [tid, fromId, toId, offset?] */
    for (const [tid, from, to, offset = 0] of this.edges) {
      const fromId = `${tid}-${from}`;
      const toId = `${tid}-${to}`;

      const aEl = document.getElementById(fromId);
      const bEl = document.getElementById(toId);
      if (!aEl || !bEl) continue; // element missing → skip

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
    }
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
      // console.error("Tournament ID not found in URL");
      return;
    }

    this.socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/games/tournament/${tournamentId}`,
    );

    this.socket.onopen = () => {
      console.log("Tournament WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as TournamentMessage;
      this.handleMessage(message);
    };

    this.socket.onclose = () => {
      console.log("Tournament WebSocket disconnected");
    };

    this.socket.onerror = (error) => {
      // console.error("WebSocket error:", error);
    };
  }

  private handleMessage(message: TournamentMessage): void {
    console.log("Received tournament message:", message);

    switch (message.type) {
      case "error":
        this.handleError(new Error(message.data));
        break;
      case "update":
        this.refreshView();
        break;
      case "game":
        this.handleGameStart(message.data);
        break;
      default:
        console.log("Unknown message type");
    }
  }

  private handleGameStart(gameManagerId: string): void {
    console.log("Game started with ID:", gameManagerId);
    window.router.navigateTo(`/play/game/${gameManagerId}`);
  }

  private refreshView(): void {
    window.router.refresh(); // TODO: maybe make better
  }

  public async leaveTournament(): Promise<void> {
    try {
      const response = await fetch(
        `/games/tournament/leave/${this.getTournamentId()}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to leave tournament: ${response.statusText}`);
      }

      if (this.socket) {
        this.socket.close();
      }

      window.router.navigateTo("/play");
    } catch (error) {
      this.handleError(
        new Error("Failed to leave tournament. Please try again later."),
      );
    }
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
export { TournamentHandler, TournamentBracket, ElapsedTimer };
