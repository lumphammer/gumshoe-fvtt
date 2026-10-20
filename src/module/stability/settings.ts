// The Sanity & Stability settings, as the rest of the system needs them (see
// docs/stability-settings-plan.md). Everything is off unless the Stability
// rules are on.

import type { TraumaType } from "@lumphammer/investigator-fvtt-types";

import { getTranslated } from "../../functions/getTranslated";
import { settings } from "../../settings/settings";
import type { StabilityState, StabilityThresholds } from "./states";
import { stabilityStateLabels } from "./states";

export function isStabilityOn(): boolean {
  return settings.useStabilityRules.get();
}

export function areBondsOn(): boolean {
  return isStabilityOn() && settings.useBonds.get();
}

export function areStabilityStatesOn(): boolean {
  return isStabilityOn() && settings.useStabilityStates.get();
}

export function isTraumaOn(): boolean {
  return isStabilityOn() && settings.useTrauma.get();
}

export function isSanityOn(): boolean {
  return isStabilityOn() && settings.useSanityRules.get();
}

/** The highest pool in each state, or null if states are off */
export function getStabilityThresholds(): StabilityThresholds | null {
  if (!areStabilityStatesOn()) {
    return null;
  }
  const states = settings.stabilityStates.get();
  return {
    shaken: states.shaken.upTo,
    shattered: states.shattered.upTo,
    gone: states.gone.upTo,
  };
}

/** A state's name: as configured, or the translated default */
export function getStabilityStateName(state: StabilityState): string {
  const name =
    state === "steady" ? "" : settings.stabilityStates.get()[state].name;
  return name || getTranslated(stabilityStateLabels[state]);
}

/** The trauma types, if trauma's in use */
export function getTraumaTypes(): TraumaType[] {
  return isTraumaOn() ? settings.traumaTypes.get() : [];
}

/** Trauma types which can be adapted to, if trauma's in use */
export function getAdaptableTraumaTypes(): TraumaType[] {
  return getTraumaTypes().filter((type) => type.useAdaptation);
}
