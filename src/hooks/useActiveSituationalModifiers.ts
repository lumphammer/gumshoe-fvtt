import { useSyncExternalStore } from "react";

import {
  getActiveSituationalModifiers,
  subscribeToActiveSituationalModifiers,
} from "../module/items/activeSituationalModifiers";

/** The ids of an ability's active situational modifiers, kept up to date */
export function useActiveSituationalModifiers(uuid: string): readonly string[] {
  return useSyncExternalStore(subscribeToActiveSituationalModifiers, () =>
    getActiveSituationalModifiers(uuid),
  );
}
