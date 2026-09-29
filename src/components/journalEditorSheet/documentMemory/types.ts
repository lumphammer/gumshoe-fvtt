import type { Change } from "textdiff-create";

/**
 * An edit to a document. The change itself is a diff from textdiff-create, and
 * we also store the timestamp of the edit.
 */
export interface Edit {
  /** The actual change, as a diff */
  changes: Change[];
  /** The timestamp of the edit, in epoch seconds */
  timestamp: number;
  /** The serial number of the edit, unique for the document */
  serial: number;
}

/**
 * A stack of edits in a document memory. Each stack represents an older stage
 * of the memory and has pointer the next, even, older, one. So, the freshest
 * edits are in the first stack. Every time that fills once, a  combnined edit
 * isadded to the next stack, recursively.
 */
export interface Stack {
  /** The edits in this stack. Will always have length == period of the parent
   * memory
   */
  edits: Array<Edit>;
  /**
   * The state of the document the last time this stack pushed down to the
   * next stack.
   */
  bombBay: Array<Edit>;
  /**
   * A pointer to the next stack, to which we will dump edits every time we have
   * recorded `period` edits.
   */
  next: Stack | null;
}

/**
 * A document's edit memory. Older edits are stored with less granularity.
 * Any commit can be restored by walking the stacks from the start.
 */
export interface BareDocumentMemory {
  /**
   * A pointer to the first stack in the memory, the one which will contain the
   * most recent edits.
   */
  stack: Stack;
  /**
   * The curent serial number.
   */
  serial: number;
  /**
   * The period of this memory, i.e. how many edits are stored in each stack.
   */
  period: number;
  /**
   * Limit on maximum depth of stacks. The total number of edits stored will be
   * period * maxDepth, representing
   * period^maxDepth + period^(maxDepth - 1) + ... + period^1
   * total edits.
   */
  maxDepth: number | null;
}

/**
 * A document's edit memory. Older edits are stored with less granularity.
 * Contains snapshots of each stack to accelerate pushes and restores.
 */
export interface DocumentMemory extends BareDocumentMemory {
  /**
   * a cache of snapshots of each level of the document
   */
  snapshots: string[];
  /**
   * A snapshot of the most recent state of the document
   */
  state: string;
}

/**
 * This type is used in to store the document memories globally. The key is the
 * id of the document (aka JournalEntryPage) plus the id of the and the
 */
export type DocumentMemoryCollection = Record<string, BareDocumentMemory>;
