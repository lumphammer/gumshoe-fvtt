import { describe, expect, it } from "vitest";

import type { RebuildRecord } from "./rebuild";
import {
  getBondAfterRebuild,
  getRebuildOutcome,
  getRebuildStabilityRefresh,
  getStabilityAfterRebuild,
  parseRebuildRecord,
  serializeRebuildRecord,
} from "./rebuild";

describe("getRebuildOutcome", () => {
  it.each([
    // die, total
    [6, 6, "successful6"],
    // a 6 that only succeeds with points spent is still a successful 6
    [6, 9, "successful6"],
    [4, 4, "success"],
    // a total of 6 or more without a 6 on the die is an ordinary success
    [5, 8, "success"],
    [3, 3, "failure"],
    [1, 1, "failed1"],
    // a 1 that succeeds with points spent isn't a failed 1
    [1, 4, "success"],
  ] as const)("die %i, total %i: %s", (die, total, expected) => {
    expect(getRebuildOutcome({ die, total })).toBe(expected);
  });
});

describe("getRebuildStabilityRefresh", () => {
  it.each([
    ["successful6", 5, 5],
    ["success", 5, 3],
    // d-2, minimum 1
    ["success", 2, 1],
    ["success", 1, 1],
    ["failure", 6, 0],
    ["failed1", 6, 0],
  ] as const)("%s with a %i refreshes %i", (outcome, die, expected) => {
    expect(getRebuildStabilityRefresh(outcome, die)).toBe(expected);
  });
});

describe("getStabilityAfterRebuild", () => {
  it.each([
    // spend 1 of 5, refresh 3: 7, but capped at the rating of 6
    [5, 6, 1, 3, 6],
    // spend 2 of 2, refresh 1
    [2, 6, 2, 1, 1],
    // failure: only the spend comes off
    [4, 6, 2, 0, 2],
    // already above the rating: a refresh doesn't take any away
    [8, 6, 0, 3, 8],
  ])(
    "pool %i/%i, spend %i, refresh %i: %i",
    (pool, rating, spend, refresh, expected) => {
      expect(getStabilityAfterRebuild({ pool, rating, spend, refresh })).toBe(
        expected,
      );
    },
  );
});

describe("getBondAfterRebuild", () => {
  it.each([
    [2, "successful6", 4],
    [3, "successful6", 4],
    [3, "success", 4],
    [4, "success", 4],
    [2, "failure", 2],
    [0, "failed1", -1],
  ] as const)("%i after %s: %i", (points, outcome, expected) => {
    expect(getBondAfterRebuild(points, outcome)).toBe(expected);
  });

  it.each([
    [1, "successful6", 2],
    [2, "success", 2],
    // above the cap (from before adapting): no gain, but no loss either
    [3, "success", 3],
    [3, "failed1", 2],
  ] as const)(
    "Adapted to Violence, %i after %s: %i",
    (points, outcome, expected) => {
      expect(getBondAfterRebuild(points, outcome, 2)).toBe(expected);
    },
  );
});

describe("rebuild records", () => {
  const record: RebuildRecord = {
    bondName: 'Temple "Beth-Israel"',
    difficulty: 4,
    die: 3,
    total: 6,
    outcome: "success",
    refreshDie: 4,
    bondBefore: 2,
    bondAfter: 3,
    stabilityName: "Stability",
    stabilityBefore: 5,
    stabilityAfter: 6,
    spends: [
      { name: "Stability", spend: 1 },
      { name: "Reassurance", spend: 2 },
    ],
  };

  it("round-trips", () => {
    expect(parseRebuildRecord(serializeRebuildRecord(record))).toEqual(record);
  });

  it("round-trips without a refresh die", () => {
    const failed = { ...record, outcome: "failure" as const, refreshDie: null };
    expect(parseRebuildRecord(serializeRebuildRecord(failed))).toEqual(failed);
  });

  it.each([
    null,
    "",
    "not json",
    "[]",
    JSON.stringify({ ...record, outcome: "triumph" }),
    JSON.stringify({ ...record, bondAfter: "3" }),
    JSON.stringify({ ...record, spends: undefined }),
    JSON.stringify({ ...record, refreshDie: "4" }),
  ])("reads %j as null", (text) => {
    expect(parseRebuildRecord(text)).toBeNull();
  });

  it("drops malformed spends but keeps the record", () => {
    const parsed = parseRebuildRecord(
      JSON.stringify({
        ...record,
        spends: [{ name: "Stability", spend: 1 }, { name: 3 }],
      }),
    );
    expect(parsed?.spends).toEqual([{ name: "Stability", spend: 1 }]);
  });
});
