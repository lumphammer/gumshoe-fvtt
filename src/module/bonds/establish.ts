// Establishing a new Bond between operations (Fall of DELTA GREEN, p. 129).
// Pure functions: keep Foundry out of this file.

import { clampBondPoints } from "./rules";

/** Points from an Interpersonal ability that it costs to try */
export const establishCost = 1;

/** How much the neglected Bond drops by */
export const establishNeglect = 1;

/** How much Stability is lost when the new Bond is rejected */
export const establishRejectionStabilityLoss = 1;

/**
 * Not a test: one die, with nothing spent on it. A 1 is rejected; 2–5 bond at
 * the die minus 2; a 6 bonds at 3, and refunds the Interpersonal point.
 */
export type EstablishOutcome = "rejected" | "bonded" | "bonded6";

export function getEstablishOutcome(die: number): EstablishOutcome {
  if (die <= 1) {
    return "rejected";
  }
  return die >= 6 ? "bonded6" : "bonded";
}

/** The new Bond's points, or null if it was rejected */
export function getEstablishedBondPoints(die: number): number | null {
  switch (getEstablishOutcome(die)) {
    case "rejected":
      return null;
    case "bonded":
      return die - 2;
    case "bonded6":
      return 3;
  }
}

/** Whether the Interpersonal point comes back (on a 6) */
export function doesEstablishRefund(outcome: EstablishOutcome): boolean {
  return outcome === "bonded6";
}

/** What the neglected Bond drops to; spending it to -1 breaks it */
export function getNeglectedBondPoints(points: number): number {
  return clampBondPoints(points - establishNeglect);
}

/**
 * Everything the card shows, settled when it's rolled. Names are stored
 * rather than ids, so the card still reads correctly after a Bond or ability
 * is renamed or deleted.
 */
export type EstablishRecord = {
  bondName: string;
  die: number;
  outcome: EstablishOutcome;
  /** the new Bond's points, or null if rejected */
  bondPoints: number | null;
  /** whether this re-formed a broken Bond, rather than starting a new one */
  reformed: boolean;
  /** the ability the point came from */
  abilityName: string;
  /** the Bond that was neglected for this one, if there was one */
  neglected: { name: string; before: number; after: number } | null;
  /** Stability, if it changed (on a rejection) */
  stability: { name: string; before: number; after: number } | null;
};

const outcomes: EstablishOutcome[] = ["rejected", "bonded", "bonded6"];

export function serializeEstablishRecord(record: EstablishRecord): string {
  return JSON.stringify(record);
}

function parseChange(
  value: unknown,
): { name: string; before: number; after: number } | null | undefined {
  if (value === null) {
    return null;
  }
  if (
    typeof value === "object" &&
    "name" in value &&
    "before" in value &&
    "after" in value &&
    typeof value.name === "string" &&
    typeof value.before === "number" &&
    typeof value.after === "number"
  ) {
    return { name: value.name, before: value.before, after: value.after };
  }
  // malformed
  return undefined;
}

/**
 * Read a record back from a chat card attribute, or null if it's malformed:
 * chat messages can't be fixed after the fact.
 */
export function parseEstablishRecord(
  text: string | null,
): EstablishRecord | null {
  if (!text) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const neglected = parseChange(record["neglected"]);
  const stability = parseChange(record["stability"]);
  if (
    typeof record["bondName"] !== "string" ||
    typeof record["abilityName"] !== "string" ||
    typeof record["die"] !== "number" ||
    typeof record["reformed"] !== "boolean" ||
    !outcomes.includes(record["outcome"] as EstablishOutcome) ||
    (record["bondPoints"] !== null &&
      typeof record["bondPoints"] !== "number") ||
    neglected === undefined ||
    stability === undefined
  ) {
    return null;
  }
  return {
    bondName: record["bondName"],
    die: record["die"],
    outcome: record["outcome"] as EstablishOutcome,
    bondPoints: record["bondPoints"],
    reformed: record["reformed"],
    abilityName: record["abilityName"],
    neglected,
    stability,
  };
}
