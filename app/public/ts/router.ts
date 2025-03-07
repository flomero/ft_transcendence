// Type declarations for window extensions
declare global {
  interface Window {
    Router: typeof Router;
    router: Router;
  }
}

class Router {
  private routes: Record<string, () => Promise<string | null>>;
  private contentContainer: HTMLElement;

  constructor() {
    this.routes = {};
    const container = document.getElementById("app-content");

    if (!container) {
      throw new Error("Content container #app-content not found");
    }

    this.contentContainer = container;

    // Handle back/forward browser navigation
    window.addEventListener("popstate", (e) => this.handlePopState(e));

    // Intercept link clicks
    document.addEventListener("click", (e) => this.handleLinkClick(e));

    // Handle form submissions
    document.addEventListener("submit", (e) => this.handleFormSubmit(e));
  }

  addRoute(path: string, handler: () => Promise<string | null>): Router {
    this.routes[path] = handler;
    return this;
  }

  handlePopState(e: PopStateEvent): void {
    const path = window.location.pathname;
    this.loadRoute(path);
  }

  handleLinkClick(e: MouseEvent): void {
    // Only process links within our app
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link) return;
    if (link.getAttribute("target") === "_blank") return;
    if (link.getAttribute("data-spa-ignore")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;

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
    loader.className = "fixed top-0 left-0 w-full h-1 bg-blue-500";
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
    this.showLoader();
    let html: string | null = null;

    try {
      const customHandler = this.routes[path];

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
      }
    } catch (error) {
      console.error("Error loading route:", error);
    } finally {
      this.hideLoader();
    }
  }

  async fetchContent(path: string): Promise<string | null> {
    try {
      const response = await fetch(`${path}?partial=true`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
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
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  }

  updateActiveLinks(currentPath: string): void {
    document.querySelectorAll("nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  handleFormSubmit(e: Event): void {
    const target = e.target as HTMLElement;
    const form = target.closest("form") as HTMLFormElement | null;

    if (!form || form.getAttribute("data-spa-ignore")) return;
    if (form.method.toLowerCase() !== "get") return; // Only handle GET forms

    e.preventDefault();

    const formData = new FormData(form);
    const searchParams = new URLSearchParams(formData as any);
    const path = `${form.action.replace(window.location.origin, "")}?${searchParams.toString()}`;

    this.navigateTo(path);
  }

  init(): void {
    const path = window.location.pathname;
    this.loadRoute(path);
  }
}

window.Router = Router;

// Initialize router when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  window.router = new Router();

  // Add custom routes if needed
  // window.router.addRoute('/chat', async () => {
  //   // Custom handling for chat route
  //   // ...
  //   return await window.router.fetchContent('/chat');
  // });

  window.router.init();
});

export default Router;
