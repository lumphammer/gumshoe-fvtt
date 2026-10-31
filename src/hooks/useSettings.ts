import type { SettingsSnapshot } from "../module/snapshots/documentStores";
import { getSettingsStore } from "../module/snapshots/documentStores";
import { useSnapshotSelector } from "./useSnapshot";

export type { SettingsSnapshot };

/**
 * Something from an immutable snapshot of our settings. Re-renders only when
 * the selector's result changes (see `useSnapshotSelector`), on any client.
 * Foundry doesn't re-render sheets when a setting changes, so anything a
 * converted sheet shows from a setting should come from here.
 */
export function useSettings<R>(selector: (settings: SettingsSnapshot) => R): R {
  return useSnapshotSelector(getSettingsStore(), selector);
}
