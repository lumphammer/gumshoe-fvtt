// The Sanity & Stability settings, as the rest of the system needs them (see
// docs/stability-settings-plan.md). Everything is off unless the Stability
// rules are on. Each takes the settings to go by: a snapshot in converted
// sheets (see docs/immutable-data.md), or the live ones by default.

import type { TraumaType } from "@lumphammer/investigator-fvtt-types";

import { getTranslated } from "../../functions/getTranslated";
import type { DeepReadonly } from "../snapshots/createSnapshotStore";
import type { SettingsView } from "../../settings/settingsView";
import { liveSettings } from "../../settings/settingsView";
import type { StabilityState, StabilityThresholds } from "./states";
import { stabilityStateLabels } from "./states";

export function isStabilityOn(s: SettingsView = liveSettings): boolean {
  return s.useStabilityRules;
}

export function areBondsOn(s: SettingsView = liveSettings): boolean {
  return isStabilityOn(s) && s.useBonds;
}

export function areStabilityStatesOn(s: SettingsView = liveSettings): boolean {
  return isStabilityOn(s) && s.useStabilityStates;
}

export function isTraumaOn(s: SettingsView = liveSettings): boolean {
  return isStabilityOn(s) && s.useTrauma;
}

export function isSanityOn(s: SettingsView = liveSettings): boolean {
  return isStabilityOn(s) && s.useSanityRules;
}

/** The highest pool in each state, or null if states are off */
export function getStabilityThresholds(
  s: SettingsView = liveSettings,
): StabilityThresholds | null {
  if (!areStabilityStatesOn(s)) {
    return null;
  }
  const states = s.stabilityStates;
  return {
    shaken: states.shaken.upTo,
    shattered: states.shattered.upTo,
    gone: states.gone.upTo,
  };
}

/** A state's name: as configured, or the translated default */
export function getStabilityStateName(
  state: StabilityState,
  s: SettingsView = liveSettings,
): string {
  const name = state === "steady" ? "" : s.stabilityStates[state].name;
  return name || getTranslated(stabilityStateLabels[state]);
}

/** The trauma types, if trauma's in use */
export function getTraumaTypesFrom(
  s: SettingsView,
): readonly DeepReadonly<TraumaType>[] {
  return isTraumaOn(s) ? s.traumaTypes : [];
}

/** The trauma types, if trauma's in use (from the live settings) */
export function getTraumaTypes(): TraumaType[] {
  return getTraumaTypesFrom(liveSettings) as TraumaType[];
}

/** Trauma types which can be adapted to, if trauma's in use */
export function getAdaptableTraumaTypesFrom(
  s: SettingsView,
): readonly DeepReadonly<TraumaType>[] {
  return getTraumaTypesFrom(s).filter((type) => type.useAdaptation);
}

/** Trauma types which can be adapted to (from the live settings) */
export function getAdaptableTraumaTypes(): TraumaType[] {
  return getAdaptableTraumaTypesFrom(liveSettings) as TraumaType[];
}
