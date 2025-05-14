interface ViewTransition {
  ready: Promise<void>;
}

declare global {
  interface Document {
    startViewTransition(callback: () => Promise<void>): ViewTransition;
  }
}

export class TransitionManager {
  private container: HTMLElement;

  constructor(containerId = "app-content") {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      // console.warn("Container element not found, transitions will not work");
    }
  }

  async transition(callback: () => Promise<void>): Promise<void> {
    if (!this.container) return callback();

    if (
      "startViewTransition" in document &&
      typeof document.startViewTransition === "function"
    ) {
      return document.startViewTransition(async () => {
        await callback();
      }).ready;
    }
    // changeClasses(this.container, ["fade-in"], ["fade-out"]);

    // await new Promise((resolve) => setTimeout(resolve, 5));

    await callback();

    // void this.container.offsetWidth;

    // changeClasses(this.container, ["fade-out"], ["fade-in"]);
  }
}
