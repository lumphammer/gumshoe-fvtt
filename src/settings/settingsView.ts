import type { DeepReadonly } from "../module/snapshots/createSnapshotStore";
import type { SettingsDict } from "./settings";
import { settings } from "./settings";

/**
 * Our settings, read-only: either a snapshot (`useSettings`), or
 * `liveSettings`. Functions which depend on settings take one of these (by
 * default `liveSettings`), so converted sheets can work them out from a
 * snapshot, and everything else can carry on calling them as before.
 */
export type SettingsView = DeepReadonly<SettingsDict>;

/** The current value of each setting, read when it's asked for. */
export const liveSettings: SettingsView = new Proxy({} as SettingsView, {
  get: (_target, key) =>
    key in settings ? settings[key as keyof typeof settings].get() : undefined,
});
