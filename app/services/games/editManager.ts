// Define a generic EditOperation type
export interface EditOperation<TargetType extends string, PropertyType = any> {
  targetId: number;
  targetType: TargetType;
  property: string;
  editor: (currentValue: PropertyType) => PropertyType;
}

// Interface for objects that can be edited by the EditManager
export interface Editable<TargetType extends string> {
  // Find target object by its ID and type
  findTarget(targetId: number, targetType: TargetType): any | null;

  // Apply an update to the target
  applyUpdate(
    targetType: TargetType,
    targetId: number,
    updates: Record<string, any>,
  ): void;
}

export class EditManager<TargetType extends string> {
  private pendingEdits: EditOperation<TargetType>[] = [];
  private editsQueueLock: Promise<void> | null = null;
  private editable: Editable<TargetType>;

  constructor(editable: Editable<TargetType>) {
    this.editable = editable;
  }

  // Queue an edit operation
  async queueEdit(edit: EditOperation<TargetType>): Promise<void> {
    const release = await this.acquireLock();
    try {
      this.pendingEdits.push(edit);
    } finally {
      release();
    }
  }

  // Process all queued edits
  processQueuedEdits(): void {
    if (this.pendingEdits.length === 0) return;

    const editsToProcess = [...this.pendingEdits];
    this.pendingEdits = [];

    // Group edits by targetType and targetId for batch processing
    const editGroups = new Map<string, Map<number, Record<string, any>>>();

    // Process each edit
    for (const edit of editsToProcess) {
      const { targetType, targetId, property, editor } = edit;

      // Get the target object
      const target = this.editable.findTarget(targetId, targetType);

      if (target === null) {
        console.warn(`Target not found: ${targetType} with id ${targetId}`);
        continue;
      }

      // Create grouping key
      const typeKey = String(targetType);

      // Initialize group if needed
      if (!editGroups.has(typeKey)) {
        editGroups.set(typeKey, new Map<number, Record<string, any>>());
      }

      const typeGroup = editGroups.get(typeKey)!;

      if (!typeGroup.has(targetId)) {
        typeGroup.set(targetId, {});
      }

      const updates = typeGroup.get(targetId)!;

      // Handle array updates or object updates differently based on targetId
      if (targetId === -1) {
        // Special case for updating an entire array
        // When targetId is -1, we're updating the entire collection
        const result = editor(Array.isArray(target) ? [...target] : target);

        // If property is empty, replace the entire target
        if (property === "") {
          // For empty property, we're replacing the entire array
          updates["array"] = result;
        } else {
          // Otherwise, we're updating a specific property of the collection
          updates[property] = result;
        }
      } else {
        // Regular case for updating a specific object
        if (property === "") {
          // For empty property, we're replacing the entire object
          const newValue = editor(target);

          // Handle replacing the entire object by copying all properties
          if (typeof newValue === "object" && newValue !== null) {
            Object.keys(newValue).forEach((key) => {
              updates[key] = newValue[key];
            });
          } else {
            // Handle primitive replacement
            updates["primitive"] = newValue;
          }
        } else {
          // For specific property, just update that property
          const currentValue = target[property];
          updates[property] = editor(currentValue);
        }
      }
    }

    // Apply all updates in batches
    for (const [targetType, typeGroup] of editGroups.entries()) {
      for (const [targetId, updates] of typeGroup.entries()) {
        this.editable.applyUpdate(targetType as TargetType, targetId, updates);
      }
    }
  }

  // Acquire lock for thread safety
  private async acquireLock(): Promise<() => void> {
    if (this.editsQueueLock) {
      await this.editsQueueLock;
    }

    let releaseLock!: () => void;
    this.editsQueueLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    return releaseLock;
  }

  // Helper method to create simple property edits
  createPropertyEdit<T>(
    targetType: TargetType,
    targetId: number,
    property: string,
    value: T,
  ): EditOperation<TargetType> {
    return {
      targetType,
      targetId,
      property,
      editor: () => value,
    };
  }

  // Helper method to create edits that modify existing values
  createModifierEdit<T>(
    targetType: TargetType,
    targetId: number,
    property: string,
    modifier: (currentValue: T) => T,
  ): EditOperation<TargetType> {
    return {
      targetType,
      targetId,
      property,
      editor: modifier,
    };
  }

  // Get the current pending edits count
  get pendingEditsCount(): number {
    return this.pendingEdits.length;
  }

  // Clear all pending edits
  clearPendingEdits(): void {
    this.pendingEdits = [];
  }
}
