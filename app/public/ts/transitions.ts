export class TransitionManager {
  private container: HTMLElement;

  constructor(containerId: string = "app-content") {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      console.warn("Container element not found, transitions will not work");
    }
  }

  async transition(callback: () => Promise<void>): Promise<void> {
    if (!this.container) return callback();

    if (
      "startViewTransition" in document &&
      typeof document.startViewTransition === "function"
    ) {
      return (document as any).startViewTransition(async () => {
        await callback();
      }).ready;
    } else {
      this.container.classList.remove("fade-in");
      this.container.classList.add("fade-out");

      await new Promise((resolve) => setTimeout(resolve, 300));

      await callback();

      void this.container.offsetWidth;

      this.container.classList.remove("fade-out");
      this.container.classList.add("fade-in");
    }
  }
}
