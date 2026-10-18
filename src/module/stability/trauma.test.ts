import { describe, expect, it } from "vitest";

import type { TraumaTestInput, TraumaTestRecord } from "./trauma";
import {
  didAdapt,
  getTraumaDifficulty,
  parseTraumaTestRecord,
  resolveTraumaTest,
  serializeTraumaTestRecord,
} from "./trauma";

describe("getTraumaDifficulty", () => {
  it.each([
    ["violence", false, "steady", 4],
    ["helplessness", true, "steady", 2],
    ["unnatural", false, "steady", 5],
    ["violence", false, "shaken", 5],
    ["violence", true, "shattered", 3],
    ["unnatural", false, "shaken", 6],
  ] as const)("%s, adapted %s, %s: %i", (trauma, adapted, state, expected) => {
    expect(getTraumaDifficulty({ trauma, adapted, state })).toBe(expected);
  });
});

const input = (extra: Partial<TraumaTestInput>): TraumaTestInput => ({
  trauma: "violence",
  pool: 8,
  rating: 8,
  spend: 0,
  total: 3,
  difficulty: 4,
  potentialLoss: 3,
  adaptationProgress: 0,
  sanityLostThisOperation: 0,
  ...extra,
});

describe("resolveTraumaTest", () => {
  it("follows the book's example (p. 119)", () => {
    // Seabring: pool 8, spends 2, rolls a 1 against 5, loses 3
    const result = resolveTraumaTest(
      input({ trauma: "unnatural", spend: 2, total: 3, difficulty: 5 }),
    );
    expect(result).toMatchObject({
      succeeded: false,
      loss: 3,
      poolAfter: 3,
      stateAfter: "steady",
      worsened: false,
      sanityLoss: 0,
      adaptationProgressAfter: null,
    });
  });

  it("loses nothing more on a success", () => {
    const result = resolveTraumaTest(input({ spend: 1, total: 4 }));
    expect(result).toMatchObject({ succeeded: true, loss: 0, poolAfter: 7 });
    // a success doesn't count towards adapting, or break the run
    expect(result.adaptationProgressAfter).toBe(0);
    expect(
      resolveTraumaTest(input({ total: 6, adaptationProgress: 2 }))
        .adaptationProgressAfter,
    ).toBe(2);
  });

  it("ticks a box for a loss which leaves the Agent steady", () => {
    const result = resolveTraumaTest(input({ adaptationProgress: 2 }));
    expect(result.adaptationProgressAfter).toBe(3);
    expect(didAdapt(2, result.adaptationProgressAfter)).toBe(true);
  });

  it("clears them for a loss which leaves the Agent Shaken", () => {
    const result = resolveTraumaTest(input({ pool: 2, adaptationProgress: 2 }));
    expect(result).toMatchObject({
      poolAfter: -1,
      stateBefore: "steady",
      stateAfter: "shaken",
      worsened: true,
      adaptationProgressAfter: 0,
    });
  });

  it("doesn't count once adapted", () => {
    expect(
      resolveTraumaTest(input({ adaptationProgress: 3 }))
        .adaptationProgressAfter,
    ).toBeNull();
  });

  it("takes a rating point on becoming Shattered", () => {
    const result = resolveTraumaTest(input({ pool: -2, potentialLoss: 5 }));
    expect(result).toMatchObject({
      poolAfter: -7,
      stateBefore: "shaken",
      stateAfter: "shattered",
      ratingLoss: 1,
    });
    // already Shattered: no more
    expect(
      resolveTraumaTest(input({ pool: -7, potentialLoss: 2 })).ratingLoss,
    ).toBe(0);
  });

  it("judges the loss from where spending left the Agent", () => {
    // spending 1 makes them Shaken; losing 2 more doesn't make it worse
    const result = resolveTraumaTest(
      input({ pool: 1, spend: 1, potentialLoss: 2 }),
    );
    expect(result).toMatchObject({
      stateBefore: "shaken",
      stateAfter: "shaken",
      worsened: false,
    });
  });

  it("costs Sanity for an Unnatural shock, the worst once an operation", () => {
    const shaken = resolveTraumaTest(
      input({ trauma: "unnatural", pool: 2, potentialLoss: 3 }),
    );
    expect(shaken).toMatchObject({
      stateAfter: "shaken",
      sanityLoss: 1,
      sanityLostThisOperationAfter: 1,
    });
    // then Shattered: only the difference
    const shattered = resolveTraumaTest(
      input({
        trauma: "unnatural",
        pool: -1,
        potentialLoss: 6,
        sanityLostThisOperation: 1,
      }),
    );
    expect(shattered).toMatchObject({
      stateAfter: "shattered",
      sanityLoss: 1,
      sanityLostThisOperationAfter: 2,
    });
    // and Shaken again costs nothing more
    expect(
      resolveTraumaTest(
        input({
          trauma: "unnatural",
          pool: 2,
          potentialLoss: 3,
          sanityLostThisOperation: 1,
        }),
      ).sanityLoss,
    ).toBe(0);
  });

  it("costs no Sanity for Violence", () => {
    expect(
      resolveTraumaTest(input({ pool: 2, potentialLoss: 3 })).sanityLoss,
    ).toBe(0);
  });
});

describe("trauma test records", () => {
  const record: TraumaTestRecord = {
    trauma: "unnatural",
    difficulty: 6,
    adapted: false,
    shaken: true,
    potentialLoss: 3,
    die: 2,
    total: 3,
    succeeded: false,
    spends: [
      { name: "Stability", spend: 1 },
      { name: 'Mom "Ma"', spend: 0 },
    ],
    stability: { name: "Stability", before: 1, after: -3 },
    stateAfter: "shaken",
    worsened: false,
    stabilityRating: null,
    sanity: { name: "Sanity", before: 5, after: 4 },
    adaptation: null,
  };

  it("round-trips, dropping empty spends", () => {
    expect(parseTraumaTestRecord(serializeTraumaTestRecord(record))).toEqual({
      ...record,
      spends: [{ name: "Stability", spend: 1 }],
    });
  });

  it.each([
    null,
    "",
    "not json",
    "[]",
    JSON.stringify({ ...record, trauma: "boredom" }),
    JSON.stringify({ ...record, stateAfter: "fine" }),
    JSON.stringify({ ...record, sanity: { name: "Sanity" } }),
    JSON.stringify({ ...record, adaptation: { before: 1 } }),
  ])("rejects %s", (text) => {
    expect(parseTraumaTestRecord(text)).toBeNull();
  });
});
