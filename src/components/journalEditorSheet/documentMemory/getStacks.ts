import type { BareDocumentMemory, Stack } from "./types";

/**
 * Given a memory object, return all stacks in the memory
 */
export function getStacks(memory: BareDocumentMemory): Stack[] {
  const stacks: Stack[] = [];
  for (let stack: Stack | null = memory.stack; stack; stack = stack.next) {
    stacks.push(stack);
  }
  return stacks;
}
