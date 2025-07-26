import createDiff from "textdiff-create";
import applyDiff from "textdiff-patch";

import { createStack } from "./createStack";
import { isMagicSerial } from "./isMagicSerial";
import { DocumentMemory, Edit, Stack } from "./types";

/**
 * This function pushes a new state onto a stack and returns the new stack.
 * Recurses down onto deeper stacks if necessary.
 */
function push(
  stack: Stack,
  newEdit: Edit,
  serial: number,
  period: number,
  depth: number,
  maxDepth: number | null,
  snapshots: string[],
): [Stack, string[]] {
  let nextStack = stack.next;

  // the new bombBay is the old bombBay plus the overflow from edits
  let bombBay: Edit[] = [...stack.bombBay];
  if (stack.edits.length >= period) {
    bombBay.push(stack.edits[0]);
  }

  // the new edits
  const edits = [
    ...stack.edits.slice(stack.edits.length === period ? 1 : 0),
    newEdit,
  ];

  let newSnapshots = snapshots;

  if (
    isMagicSerial(period, depth, serial) &&
    (maxDepth === null || depth < maxDepth)
  ) {
    // calculate the current snapshot by applying edits
    const [oldState = "", ...nextSnapshots] = snapshots;
    let newState = oldState;
    for (const edit of bombBay) {
      newState = applyDiff(newState, edit.changes);
    }
    const editToPush: Edit = {
      changes: createDiff(oldState, newState),
      timestamp: bombBay[bombBay.length - 1].timestamp,
      serial: bombBay[bombBay.length - 1].serial,
    };
    bombBay = [];

    let newNextSnapshots: string[] = [];
    [nextStack, newNextSnapshots] = push(
      nextStack || createStack(),
      editToPush,
      serial,
      period,
      depth + 1,
      maxDepth,
      nextSnapshots.length > 0 ? nextSnapshots : [""],
    );
    newSnapshots = [newState, ...newNextSnapshots];
  }

  return [
    {
      bombBay,
      edits,
      next: nextStack,
    },
    newSnapshots,
  ];
}

/**
 * Add a new state to the memory
 */
export function save(memory: DocumentMemory, state: string): DocumentMemory {
  if (state === memory.state) return memory;
  const serial = memory.serial + 1;
  const changes = createDiff(memory.state, state);
  const edit: Edit = {
    changes,
    timestamp: Math.floor(Date.now() / 1000),
    serial,
  };
  const [stack, snapshots] = push(
    memory.stack,
    edit,
    serial,
    memory.period,
    1,
    memory.maxDepth,
    memory.snapshots,
  );
  return {
    stack,
    serial,
    period: memory.period,
    maxDepth: memory.maxDepth,
    state,
    snapshots,
  };
}
