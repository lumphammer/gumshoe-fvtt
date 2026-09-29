import applyDiff from "textdiff-patch";

import type { DocumentMemory } from ".";
import { getStacks } from "./getStacks";

/**
 * Given a memory and a serial number, return the state at that serial number
 */
export function restoreVersion(memory: DocumentMemory, serial: number) {
  const stacks = getStacks(memory);
  const stackIndex = stacks.findIndex((stack) =>
    stack.edits.some((edit) => edit.serial === serial),
  );
  if (stackIndex < 0) {
    throw new Error(`Could not find stack with serial ${serial}`);
  }
  let result = memory.snapshots[stackIndex];
  for (const edit of stacks[stackIndex].bombBay) {
    result = applyDiff(result, edit.changes);
  }
  const editIndex = stacks[stackIndex].edits.findIndex(
    (edit) => edit.serial === serial,
  );
  for (let i = 0; i <= editIndex; i++) {
    result = applyDiff(result, stacks[stackIndex].edits[i].changes);
  }

  return result;
}
