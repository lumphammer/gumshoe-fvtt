// Network contacts (Fall of DELTA GREEN, p. 068; Night's Black Agents has the
// same rule). Pure functions; the Foundry glue is in `contactActions.ts`.

/**
 * What the Network ability refreshes to: its rating, less what contacts still
 * hold, so that its pool and theirs add up to the rating. Never below 0.
 */
export function getNetworkRefreshPool({
  rating,
  contactPools,
}: {
  rating: number;
  contactPools: number[];
}): number {
  const held = contactPools.reduce(
    (total, pool) => total + Math.max(0, pool),
    0,
  );
  return Math.max(0, rating - held);
}

/** The most Network points that can go to a contact: what the pool has */
export function getMaxAssignablePoints(networkPool: number): number {
  return Math.max(0, networkPool);
}

/** Tapping a contact for information: 1 point, or 2 for a mother lode */
export const infoCosts = [1, 2] as const;

export type ContactCardKind = "assign" | "test" | "info";

/**
 * Everything a contact's chat card shows, settled when it's posted. Names are
 * stored rather than ids, so the card still reads correctly after the contact
 * is renamed or deleted.
 */
export type ContactRecord = {
  kind: ContactCardKind;
  contactName: string;
  location: string;
  /** points assigned, spent on the test, or paid for information */
  points: number;
  /** for a test: what the die showed, and the total */
  die: number | null;
  total: number | null;
  poolBefore: number;
  poolAfter: number;
  /** for assigning: the Network ability's name and pool */
  networkName: string | null;
  networkBefore: number | null;
  networkAfter: number | null;
};

const kinds: ContactCardKind[] = ["assign", "test", "info"];

export function serializeContactRecord(record: ContactRecord): string {
  return JSON.stringify(record);
}

const isNumberOrNull = (x: unknown) => x === null || typeof x === "number";
const isStringOrNull = (x: unknown) => x === null || typeof x === "string";

/**
 * Read a contact record back from a chat card attribute, or null if it's
 * malformed: chat messages can't be fixed after the fact.
 */
export function parseContactRecord(text: string | null): ContactRecord | null {
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
  if (
    !kinds.includes(record["kind"] as ContactCardKind) ||
    typeof record["contactName"] !== "string" ||
    typeof record["location"] !== "string" ||
    !["points", "poolBefore", "poolAfter"].every(
      (key) => typeof record[key] === "number",
    ) ||
    !["die", "total", "networkBefore", "networkAfter"].every((key) =>
      isNumberOrNull(record[key]),
    ) ||
    !isStringOrNull(record["networkName"])
  ) {
    return null;
  }
  return record as ContactRecord;
}
