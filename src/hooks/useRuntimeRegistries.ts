import type { RuntimeConfig } from "../runtime";
import { getRuntimeRegistriesStore } from "../module/snapshots/gameStores";
import { useSnapshot } from "./useSnapshot";

/**
 * The installed presets and themes, following new ones being installed. (The
 * registered objects themselves, which aren't copied: only the lists are.)
 */
export const useRuntimeRegistries = () =>
  useSnapshot(getRuntimeRegistriesStore()) as Pick<
    RuntimeConfig,
    "presets" | "themes"
  >;
