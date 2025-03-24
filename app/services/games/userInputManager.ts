import { UserInput } from "../../types/games/userInput";

export class UserInputManager {
  private inputQueue: UserInput[] = [];
  private queueLock: Promise<void> | null = null;

  constructor() {}

  // Queue a user input action
  async queueInput(action: UserInput): Promise<void> {
    const release = await this.acquireLock();
    try {
      this.inputQueue.push(action);
    } finally {
      release();
    }
  }

  // Get all queued inputs, sorted by timestamp, and clear the queue
  async getAndClearInputs(): Promise<UserInput[]> {
    if (this.inputQueue.length === 0) return [];

    const release = await this.acquireLock();
    try {
      // Sort inputs by timestamp (earliest first)
      const sortedInputs = [...this.inputQueue].sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      this.inputQueue = [];
      return sortedInputs;
    } finally {
      release();
    }
  }

  // Acquire lock for thread safety
  private async acquireLock(): Promise<() => void> {
    if (this.queueLock) {
      await this.queueLock;
    }

    let releaseLock!: () => void;
    this.queueLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    return releaseLock;
  }

  // Get the current pending inputs count
  get pendingInputsCount(): number {
    return this.inputQueue.length;
  }
}
