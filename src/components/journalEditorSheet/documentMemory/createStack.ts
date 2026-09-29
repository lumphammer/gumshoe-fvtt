import type { Stack } from "./types";

/**
 * Create a new empty stack
 */
export function createStack(): Stack {
  return {
    edits: [],
    bombBay: [],
    next: null,
  };
}
