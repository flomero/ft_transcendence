import { toggleClasses } from "./utils.js";

declare global {
  interface Window {
    toggleSidebar: () => void;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("app-content");
  const overlay = document.getElementById("sidebar-overlay");
  const closeButton = document.getElementById("close-sidebar-mobile");

  // Function to toggle sidebar
  window.toggleSidebar = () => {
    toggleClasses(sidebar, ["translate-x-full", "translate-x-0"]);
    toggleClasses(overlay, [
      "opacity-0",
      "opacity-100",
      "pointer-events-none",
      "pointer-events-auto",
    ]);

    // For desktop behavior
    if (window.innerWidth >= 1024) {
      toggleClasses(content, ["w-[calc(100%-300px)]", "mr-[300px]"]);
    }
  };

  // Close sidebar when clicking overlay (mobile)
  overlay?.addEventListener("click", window.toggleSidebar);

  // Close sidebar with mobile close button
  closeButton?.addEventListener("click", window.toggleSidebar);
});
