export {};

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
  window.toggleSidebar = function () {
    sidebar.classList.toggle("translate-x-full");
    sidebar.classList.toggle("translate-x-0");
    overlay.classList.toggle("opacity-0");
    overlay.classList.toggle("opacity-100");
    overlay.classList.toggle("pointer-events-none");
    overlay.classList.toggle("pointer-events-auto");

    // For desktop behavior
    if (window.innerWidth >= 1024) {
      content.classList.toggle("w-[calc(100%-300px)]");
      content.classList.toggle("mr-[300px]");
    }
  };

  // Close sidebar when clicking overlay (mobile)
  overlay.addEventListener("click", window.toggleSidebar);

  // Close sidebar with mobile close button
  closeButton.addEventListener("click", window.toggleSidebar);
});
