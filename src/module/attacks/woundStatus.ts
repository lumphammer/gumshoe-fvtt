import type { WoundState } from "./rules";

/** The wound states which have a status effect */
export type WoundStatusState = Exclude<WoundState, "ok">;

export const woundStatusStates: WoundStatusState[] = [
  "hurt",
  "seriouslyWounded",
  "dead",
];

export interface WoundStatusTransition {
  remove: WoundStatusState[];
  add: WoundStatusState | null;
}

/**
 * Work out which wound statuses to change when Health moves an actor from one
 * wound state to another. Nothing happens unless the state changes, so a
 * status set by hand survives Health changes within the same state. The
 * statuses are exclusive: the new state's replaces all the others.
 */
export function getWoundStatusTransition(
  before: WoundState,
  after: WoundState,
): WoundStatusTransition | null {
  if (before === after) return null;
  return {
    remove: woundStatusStates.filter((state) => state !== after),
    add: after === "ok" ? null : after,
  };
}
