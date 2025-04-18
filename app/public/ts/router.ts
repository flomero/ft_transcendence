import { TransitionManager } from "./transitions.js";
import LobbyHandler from "./lobby.js";
import { initPongGame, PongGame } from "./pong.js";

// Route handler interface with lifecycle hooks
interface RouteHandler {
  onEnter?: () => void | Promise<void>; // Called when route is entered
  onExit?: () => void | Promise<void>; // Called when navigating away
  contentHandler?: () => Promise<string | null>; // Optional custom content handler
}

// Type declarations for window extensions
declare global {
  interface Window {
    Router: typeof Router;
    router: Router;
    pongGame: PongGame | undefined;
    LobbyHandler: typeof LobbyHandler;
  }
}

class Router {
  private routes: Record<string, RouteHandler>;
  private contentContainer: HTMLElement;
  private transitionManager: TransitionManager;
  private currentPath: string = "";
  private isInitialLoad: boolean = true;

  constructor() {
    this.routes = {};
    const container = document.getElementById("app-content");

    if (!container) {
      throw new Error("Content container #app-content not found");
    }

    this.contentContainer = container;
    this.contentContainer.classList.add("fade-transition");
    this.contentContainer.classList.add("fade-in");
    this.transitionManager = new TransitionManager("app-content");

    window.addEventListener("popstate", (e) => this.handlePopState(e));
    document.addEventListener("click", (e) => this.handleLinkClick(e));
    document.addEventListener("submit", (e) => this.handleFormSubmit(e));
  }

  addRoute(
    path: string,
    handler: RouteHandler | (() => Promise<string | null>),
  ): Router {
    if (typeof handler === "function") {
      this.routes[path] = { contentHandler: handler };
    } else {
      this.routes[path] = handler;
    }
    return this;
  }

  private findMatchingRoute(
    path: string,
  ): { handler: RouteHandler; params: Record<string, string> } | null {
    if (this.routes[path]) {
      return { handler: this.routes[path], params: {} };
    }

    for (const routePath in this.routes) {
      if (this.isPathMatch(routePath, path)) {
        const params = this.extractPathParams(routePath, path);
        return { handler: this.routes[routePath], params };
      }
    }

    return null;
  }

  private isPathMatch(pattern: string, path: string): boolean {
    if (!pattern.includes(":")) return false;

    const patternParts = pattern.split("/");
    const pathParts = path.split("/");

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) continue;
      if (patternParts[i] !== pathParts[i]) return false;
    }

    return true;
  }

  private extractPathParams(
    pattern: string,
    path: string,
  ): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        const paramName = patternParts[i].substring(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }

  handlePopState(e: PopStateEvent): void {
    const path = window.location.pathname;
    this.loadRoute(path);
  }

  refresh(): void {
    const path = window.location.pathname;
    this.loadRoute(path);
  }

  handleLinkClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link) return;
    if (link.getAttribute("target") === "_blank") return;
    if (link.getAttribute("data-spa-ignore")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;

    if (window.location.pathname === href) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    this.navigateTo(href);
  }

  async navigateTo(path: string): Promise<void> {
    // Update browser URL without full reload
    console.log("Navigating to:", path);
    window.history.pushState({}, "", path);
    await this.loadRoute(path);
  }

  showLoader(): void {
    const loader = document.createElement("div");
    loader.id = "page-loader";
    loader.className = "fixed top-0 left-0 w-full h-[1px] bg-fg";
    loader.style.transition = "width 0.3s ease-in-out";
    document.body.appendChild(loader);

    setTimeout(() => {
      loader.style.width = "70%";
    }, 10);
  }

  hideLoader(): void {
    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.style.width = "100%";
      setTimeout(() => {
        loader.remove();
      }, 300);
    }
  }

  async loadRoute(path: string): Promise<void> {
    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      this.currentPath = path;
      this.updateActiveLinks(path);
      return;
    }

    this.showLoader();

    try {
      await this.runExitHandler();

      this.currentPath = path;

      await this.transitionManager.transition(async () => {
        const matchedRoute = this.findMatchingRoute(path);
        const customHandler =
          matchedRoute?.handler?.contentHandler ||
          this.routes[path]?.contentHandler;
        let html: string | null = null;

        if (customHandler) {
          html = await customHandler();
        } else {
          html = await this.fetchContent(path);
        }

        if (html) {
          this.contentContainer.innerHTML = html;
          this.executeScripts();
          this.updateActiveLinks(path);
          window.scrollTo(0, 0);

          await this.runEnterHandler(path);

          document.dispatchEvent(
            new CustomEvent("contentLoaded", {
              detail: { path },
            }),
          );
        }
      });
    } catch (error) {
      console.error("Error loading route:", error);
    } finally {
      this.hideLoader();
    }
  }

  private async runExitHandler(): Promise<void> {
    if (!this.currentPath) return;

    const matchedRoute = this.findMatchingRoute(this.currentPath);
    if (matchedRoute?.handler?.onExit) {
      try {
        await matchedRoute.handler.onExit();
      } catch (error) {
        console.error("Error in route exit handler:", error);
      }
    }
  }

  private async runEnterHandler(path: string): Promise<void> {
    const matchedRoute = this.findMatchingRoute(path);
    if (matchedRoute?.handler?.onEnter) {
      try {
        await matchedRoute.handler.onEnter();
      } catch (error) {
        console.error("Error in route enter handler:", error);
      }
    }
  }

  async fetchContent(path: string): Promise<string | null> {
    try {
      const response = await fetch(`${path}?partial=true`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
        redirect: "follow",
      });

      if (!response.ok) {
        console.error("Fetch error:", response.status, response.statusText);
        this.displayError(response.status, response.statusText);
        return null;
      }

      const pageTitle = response.headers.get("X-Page-Title");
      if (pageTitle) {
        document.title = pageTitle;
      }

      const redirectPath = response.headers.get("X-SPA-Redirect");
      if (redirectPath) {
        console.log("Custom redirect to:", redirectPath);
        window.history.replaceState({}, "", redirectPath);
        this.updateActiveLinks(redirectPath);
        return await this.fetchContent(redirectPath);
      }

      if (response.redirected) {
        const redirectUrl = new URL(response.url);
        const redirectPath = redirectUrl.pathname;
        console.log("Redirected to:", redirectPath);
        window.history.replaceState({}, "", redirectPath);
        this.updateActiveLinks(redirectPath);
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.redirectTo) {
          console.log("JSON redirect to:", data.redirectTo);
          window.history.replaceState({}, "", data.redirectTo);
          this.updateActiveLinks(data.redirectTo);
          // Instead of returning the JSON response content, fetch the new route's content
          return await this.fetchContent(data.redirectTo);
        }
        // Only for JSON responses that are actually meant to be displayed
        return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      }

      return await response.text();
    } catch (error) {
      console.error("Fetch error:", error);
      return null;
    }
  }

  executeScripts(): void {
    // Execute any script tags in the loaded content
    const scripts = this.contentContainer.querySelectorAll("script");
    for (const oldScript of scripts) {
      const newScript = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    }
  }

  updateActiveLinks(currentPath: string): void {
    for (const link of document.querySelectorAll("nav a")) {
      const href = link.getAttribute("href");
      if (href === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    }
  }

  handleFormSubmit(e: Event): void {
    const target = e.target as HTMLElement;
    const form = target.closest("form") as HTMLFormElement | null;

    if (!form || form.getAttribute("data-spa-ignore")) return;
    if (form.method.toLowerCase() !== "get") return; // Only handle GET forms

    e.preventDefault();

    const formData = new FormData(form);
    const searchParams = new URLSearchParams(
      formData as unknown as URLSearchParams,
    );
    const path = `${form.action.replace(
      window.location.origin,
      "",
    )}?${searchParams.toString()}`;

    this.navigateTo(path);
  }

  displayError(status: string | number, message: string): void {
    const html = `
     <div class="absolute inset-0 w-full h-full overflow-hidden">
      <div class="absolute text-[15rem] font-bold opacity-[0.07] select-none top-1/4 -left-10">${status}</div>
      <div class="absolute text-[15rem] font-bold opacity-[0.07] select-none bottom-1/4 -right-10">${status}</div>
    </div>

    <div class="layout fixed inset-0 z-10 flex flex-col items-center justify-center">
      <div class="bg-transparent border relative z-10 p-8 rounded-lg flex flex-col items-center justify-center text-center w-xl max-w-8/12 backdrop-blur-sm">
        <h1 class="text-4xl font-bold text-red-600 mb-1">Error ${status}</h1>
        <p class="bg-bg-muted p-3 text-center text-balance rounded-lg shadow-md mb-6 overflow-auto font-mono max-h-40">${message}</p>
        <a href="/" class="underline">Go Home</a>
      </div>
    </div>
    `;
    this.contentContainer.innerHTML = html;
  }

  init(): void {
    const path = window.location.pathname;
    this.loadRoute(path);
  }
}

window.Router = Router;

document.addEventListener("DOMContentLoaded", () => {
  window.router = new Router();

  window.router.addRoute("/play/game/:id", {
    onEnter: () => {
      window.pongGame = initPongGame();
    },
    onExit: () => {
      if (window.pongGame) {
        if (window.pongGame.gameSocket) {
          window.pongGame.gameSocket.close();
        }
      }
    },
  });

  window.router.addRoute("/games/lobby/join/:id", {
    onEnter: () => {
      const lobbyHandler = new LobbyHandler();
      lobbyHandler.connect();
      window.lobbyHandler = lobbyHandler;
    },
    onExit: () => {
      if (window.lobbyHandler) {
        if (window.lobbyHandler.socket) {
          window.lobbyHandler.socket.close();
        }
      }
    },
  });

  // window.router.addRoute("/login", {
  //   onEnter: () => {
  //     // Check if the referrer is from Google accounts
  //     const referrer = document.referrer;
  //     if (referrer && referrer.startsWith("https://accounts.google.com/")) {
  //       console.log("Detected Google OAuth redirect, performing full page reload");
  //       // Force a full page reload to ensure cookies are properly set
  //       window.location.reload();
  //     }
  //   }
  // });

  window.router.init();
});

export default Router;
