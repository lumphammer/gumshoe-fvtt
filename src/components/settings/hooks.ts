import { produce } from "immer";
import { useCallback, useMemo, useReducer } from "react";

import { useRefStash } from "../../hooks/useRefStash";
import type { SettingsDict } from "../../settings/settings";
import { getSettingsDict } from "../../settings/settings";
import { StateContext } from "./contexts";
import { createUseSelectorHook } from "./reducerTools";
import { store } from "./store";
import type { Setters } from "./types";

/**
 * Top-level hook for settings state. This sets up the reducer and temporary
 * state
 */
export const useSettingsState = () => {
  const initialState = useMemo(() => ({ settings: getSettingsDict() }), []);
  const [tempState, dispatch] = useReducer(store.reducer, initialState);
  const tempStateRef = useRefStash(tempState);
  const setters = useMemo(() => {
    const setters: Partial<Setters> = {};
    for (const k of Object.keys(
      initialState.settings,
    ) as (keyof (typeof initialState)["settings"])[]) {
      setters[k] = (newVal: any) => {
        dispatch(store.creators.setSome({ newSettings: { [k]: newVal } }));
      };
    }
    return setters as Setters;
  }, [initialState]);
  const isDirty = useCallback(() => {
    return (
      JSON.stringify(tempStateRef.current) !== JSON.stringify(initialState)
    );
  }, [initialState, tempStateRef]);

  // a reactive version of isDirty, for showing in the UI
  const hasChanges = useMemo(
    () => JSON.stringify(tempState) !== JSON.stringify(initialState),
    [initialState, tempState],
  );

  function modify(fn: (state: SettingsDict) => void) {
    const newState = produce(tempStateRef.current.settings, (draft) => {
      fn(draft);
    });
    dispatch(store.creators.setSome({ newSettings: newState }));
  }

  return {
    tempState,
    tempStateRef,
    setters,
    dispatch,
    isDirty,
    hasChanges,
    modify,
  };
};

/**
 * A hook retrieve data from the state
 */
export const useStateSelector = createUseSelectorHook(StateContext);
