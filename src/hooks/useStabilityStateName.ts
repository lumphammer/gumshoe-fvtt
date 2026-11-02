import { getStabilityStateName } from "../module/stability/settings";
import type { StabilityState } from "../module/stability/states";
import { useSettings } from "./useSettings";

/**
 * A Stability state's name, as the settings call it ("" for none), following
 * them being renamed
 */
export const useStabilityStateName = (state: StabilityState | null): string =>
  useSettings((s) => (state === null ? "" : getStabilityStateName(state, s)));
