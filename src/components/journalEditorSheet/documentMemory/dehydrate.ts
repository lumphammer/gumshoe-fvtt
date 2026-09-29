import type { BareDocumentMemory, DocumentMemory } from "./types";

/**
 * Convert the working memory into one with the state and snapshots removed
 */
export function dehydrate(documentMemory: DocumentMemory): BareDocumentMemory {
  return {
    stack: documentMemory.stack,
    serial: documentMemory.serial,
    period: documentMemory.period,
    maxDepth: documentMemory.maxDepth,
  };
}
