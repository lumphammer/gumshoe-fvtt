import type { JournalEntrySnapshot } from "../module/snapshots/documentStores";
import { getJournalEntryStore } from "../module/snapshots/documentStores";
import { useSnapshotSelector } from "./useSnapshot";

export type { JournalEntrySnapshot };

/**
 * Something from an immutable snapshot of a journal entry and its pages.
 * Re-renders only when the selector's result changes (see
 * `useSnapshotSelector`).
 */
export function useJournalEntrySnapshot<R>(
  entry: JournalEntry.Implementation,
  selector: (entry: JournalEntrySnapshot) => R,
): R {
  return useSnapshotSelector(getJournalEntryStore(entry), selector);
}
