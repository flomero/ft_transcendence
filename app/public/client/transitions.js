import { changeClasses } from "./utils.js";
export class TransitionManager {
  constructor(containerId = "app-content") {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn("Container element not found, transitions will not work");
    }
  }
  async transition(callback) {
    if (!this.container) return callback();
    if (
      "startViewTransition" in document &&
      typeof document.startViewTransition === "function"
    ) {
      return document.startViewTransition(async () => {
        await callback();
      }).ready;
    }
    changeClasses(this.container, ["fade-in"], ["fade-out"]);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await callback();
    void this.container.offsetWidth;
    changeClasses(this.container, ["fade-out"], ["fade-in"]);
  }
}
//# sourceMappingURL=transitions.js.map
