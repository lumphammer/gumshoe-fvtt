import { getStacks } from "./getStacks";
import type { BareDocumentMemory, Edit } from "./types";

/**
 * Given a memory object, return all edits in the memory
 */
export function getAccessibleEdits(memory: BareDocumentMemory) {
  const stacks = getStacks(memory).reverse();
  const edits: Edit[] = stacks.flatMap((stack) => stack.edits);
  return edits;
}
