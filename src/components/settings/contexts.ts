import { createContext } from "react";

import { systemLogger } from "../../functions/utilities";
import type { SettingsDict } from "../../settings/settings";
import { getSettingsDict } from "../../settings/settings";
import type { State } from "./types";

/**
 * Context for settings dispatch funtion
 */
export const DispatchContext = createContext<React.Dispatch<any>>(() => {
  systemLogger.warn("DispatchContext used without a provider");
});

/**
 * Context for settings state
 * We put settings in an object instead of just having it be the top-level state
 * directly so there's room for expansion if we ever what more things in state
 */
export const StateContext = createContext<State>({
  settings: getSettingsDict(),
});

/**
 * Context for whether the settings are dirty
 */
export const DirtyContext = createContext<() => boolean>(() => {
  systemLogger.warn("DirtyContext used without a provider");
  return false;
});

export const ModifyContext = createContext<
  (fn: (state: SettingsDict) => void) => void
>(() => {
  systemLogger.warn("ModifyContext used without a provider");
});
