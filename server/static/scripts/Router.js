/// <reference path="typedefs.js" />

/** Router class */
export default class Router {
  /**
   * Create a new Router
   * @param {Routes} routes The routes to use
   */
  constructor(routes) {
    console.log("Router initialized");
    this.routes = routes;
    this.init();
  }

  /** Initialize the router */
  init() {
    window.addEventListener("popstate", () => {
      this.handleRoute(window.location.pathname);
    });

    document.body.addEventListener("click", (event) => {
      if (event.target.tagName === "A") {
        const href = event.target.getAttribute("href");

        if (this.isExternalLink(href)) {
          event.preventDefault();
          window.open(href, "_blank");
        } else if (href) {
          event.preventDefault();
          this.navigate(href);
        }
      }
    });

    this.handleRoute(window.location.pathname);
  }

  /**
   * Check if a link is external
   * @param {string} href The link to check
   * @returns {boolean} True if the link is external
   * @example router.isExternalLink("https://example.com"); // true
   */
  isExternalLink(href) {
    try {
      const link = new URL(href, window.location.origin);
      return link.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  /**
   * Navigate to a path
   * @param {string} path The path to navigate to
   * @example router.navigate("/about");
   */
  navigate(path) {
    window.history.pushState({}, "", path);
    this.handleRoute(path);
  }

  /**
   * Handle a route
   * @param {string} path The path to handle
   */
  handleRoute(path) {
    const cleanPath = path.split(/[?#]/)[0];
    console.log("Navigating to:", cleanPath);

    const route = this.routes[cleanPath];
    if (route) {
      route();
    } else {
      this.handle404();
    }
  }

  /** Handle a 404 route */
  handle404() {
    // TODO: Implement a 404 page
    console.error("404: Route not found");
  }
}
