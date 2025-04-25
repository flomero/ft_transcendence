import type Router from "./router.js";
import { hideById } from "./utils.js";

declare global {
  interface Window {
    logout: () => void;
    router: Router;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.logout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    hideById("auth-header");
    if (window.router) {
      window.router.navigateTo("/login");
    } else {
      window.location.href = "/login";
    }

    console.log("User logged out successfully");
  };
});
