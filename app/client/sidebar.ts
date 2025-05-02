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

export function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("app-content");
  const overlay = document.getElementById("sidebar-overlay");

  if (!sidebar || !content || !overlay) return;

  // Sidebar hidden (off)
  sidebar.classList.add("translate-x-full");
  sidebar.classList.remove("translate-x-0");

  // Overlay hidden (off)
  overlay.classList.add("opacity-0", "pointer-events-none");
  overlay.classList.remove("opacity-100", "pointer-events-auto");

  // Content full width (off)
  if (window.innerWidth >= 1024) {
    content.classList.remove("w-[calc(100%-300px)]", "mr-[300px]");
  }
}
