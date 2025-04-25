import { toggleClasses } from "./utils.js";
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("app-content");
  const overlay = document.getElementById("sidebar-overlay");
  const closeButton = document.getElementById("close-sidebar-mobile");
  window.toggleSidebar = () => {
    toggleClasses(sidebar, ["translate-x-full", "translate-x-0"]);
    toggleClasses(overlay, [
      "opacity-0",
      "opacity-100",
      "pointer-events-none",
      "pointer-events-auto",
    ]);
    if (window.innerWidth >= 1024) {
      toggleClasses(content, ["w-[calc(100%-300px)]", "mr-[300px]"]);
    }
  };
  overlay?.addEventListener("click", window.toggleSidebar);
  closeButton?.addEventListener("click", window.toggleSidebar);
});
//# sourceMappingURL=sidebar.js.map
