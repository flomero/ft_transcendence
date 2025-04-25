import { hideById } from "./utils.js";
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
//# sourceMappingURL=logout.js.map
