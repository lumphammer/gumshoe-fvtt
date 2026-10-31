import { useMemo, useSyncExternalStore } from "react";

import { systemId } from "../constants";
import type { DeepReadonly } from "../module/snapshots/createSnapshotStore";
import { createSnapshotStore } from "../module/snapshots/createSnapshotStore";

/**
 * An immutable snapshot of one of our settings (`settings.foo`), which changes
 * (sharing whatever didn't change) whenever the setting does, on any client.
 * Foundry doesn't re-render sheets when a setting changes, so anything a sheet
 * shows from a setting should come from here.
 */
export function useSettingSnapshot<T>(setting: {
  key: string;
  get: () => T;
}): DeepReadonly<T> {
  const store = useMemo(
    () =>
      createSnapshotStore(
        () => foundry.utils.deepClone(setting.get()),
        (onChange) => {
          const fullKey = `${systemId}.${setting.key}`;
          // world (and user) settings are Setting documents; client settings
          // live in localStorage and have their own hook
          const onDocument = (doc: Setting.Implementation) => {
            if (doc.key === fullKey) onChange();
          };
          const onClient = (key: string) => {
            if (key === fullKey) onChange();
          };
          const ids = {
            createSetting: Hooks.on("createSetting", onDocument),
            updateSetting: Hooks.on("updateSetting", onDocument),
            clientSettingChanged: Hooks.on("clientSettingChanged", onClient),
          };
          return () => {
            Hooks.off("createSetting", ids.createSetting);
            Hooks.off("updateSetting", ids.updateSetting);
            Hooks.off("clientSettingChanged", ids.clientSettingChanged);
          };
        },
      ),
    [setting],
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
