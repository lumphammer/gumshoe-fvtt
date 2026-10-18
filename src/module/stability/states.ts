// Stability states (Fall of DELTA GREEN, p. 113). Pure functions: keep
// Foundry out of this file.

export type StabilityState = "steady" | "shaken" | "shattered" | "gone";

/** The states which have a status effect */
export type StabilityStatusState = Exclude<StabilityState, "steady">;

export const stabilityStatusStates: StabilityStatusState[] = [
  "shaken",
  "shattered",
  "gone",
];

/** The highest pool at which an Agent is Shaken */
export const shakenAt = 0;
/** ...Shattered */
export const shatteredAt = -6;
/** ...Gone */
export const goneAt = -12;

/** Read a state back from a chat card attribute */
export function parseStabilityState(
  text: string | null,
): StabilityState | null {
  return text === "steady" ||
    text === "shaken" ||
    text === "shattered" ||
    text === "gone"
    ? text
    : null;
}

/** Translation keys for the states' names */
export const stabilityStateLabels: Record<StabilityState, string> = {
  steady: "StabilityStateSteady",
  shaken: "StabilityStateShaken",
  shattered: "StabilityStateShattered",
  gone: "StabilityStateGone",
};

export function getStabilityState(pool: number): StabilityState {
  if (pool > shakenAt) return "steady";
  if (pool > shatteredAt) return "shaken";
  if (pool > goneAt) return "shattered";
  return "gone";
}

const severity: Record<StabilityState, number> = {
  steady: 0,
  shaken: 1,
  shattered: 2,
  gone: 3,
};

export function isWorseState(
  state: StabilityState,
  than: StabilityState,
): boolean {
  return severity[state] > severity[than];
}

/** Shaken or worse: Investigative spends ask first, General tests get +1 */
export function isShakenOrWorse(state: StabilityState): boolean {
  return state !== "steady";
}

export interface StabilityStatusTransition {
  remove: StabilityStatusState[];
  add: StabilityStatusState | null;
}

/**
 * Which statuses to change when the pool moves an Agent from one state to
 * another. Nothing happens unless the state changes, so a status set by hand
 * survives changes within a state. The new state's status replaces the
 * others.
 */
export function getStabilityStatusTransition(
  before: StabilityState,
  after: StabilityState,
): StabilityStatusTransition | null {
  if (before === after) return null;
  return {
    remove: stabilityStatusStates.filter((state) => state !== after),
    add: after === "steady" ? null : after,
  };
}
