import { describe, expect, it } from "vitest";

import type { EstablishRecord } from "./establish";
import {
  doesEstablishRefund,
  getEstablishedBondPoints,
  getEstablishOutcome,
  getNeglectedBondPoints,
  parseEstablishRecord,
  serializeEstablishRecord,
} from "./establish";

describe("getEstablishOutcome and getEstablishedBondPoints", () => {
  it.each([
    [1, "rejected", null],
    // die minus 2: yes, a Bond can start at 0
    [2, "bonded", 0],
    [3, "bonded", 1],
    [5, "bonded", 3],
    [6, "bonded6", 3],
  ] as const)("a %i: %s, at %s", (die, outcome, points) => {
    expect(getEstablishOutcome(die)).toBe(outcome);
    expect(getEstablishedBondPoints(die)).toBe(points);
  });
});

describe("doesEstablishRefund", () => {
  it.each([
    ["rejected", false],
    ["bonded", false],
    ["bonded6", true],
  ] as const)("%s: %s", (outcome, expected) => {
    expect(doesEstablishRefund(outcome)).toBe(expected);
  });
});

describe("getNeglectedBondPoints", () => {
  it.each([
    [3, 2],
    // neglect can break a Bond
    [0, -1],
    // but no further
    [-1, -1],
  ])("%i becomes %i", (points, expected) => {
    expect(getNeglectedBondPoints(points)).toBe(expected);
  });
});

describe("parseEstablishRecord", () => {
  const record: EstablishRecord = {
    bondName: "Ruth",
    die: 4,
    outcome: "bonded",
    bondPoints: 2,
    reformed: false,
    abilityName: "Reassurance",
    neglected: { name: "Mom", before: 3, after: 2 },
    stability: null,
  };

  it("round-trips", () => {
    expect(parseEstablishRecord(serializeEstablishRecord(record))).toEqual(
      record,
    );
  });

  it("round-trips a rejection with no Bond to neglect", () => {
    const rejected: EstablishRecord = {
      ...record,
      die: 1,
      outcome: "rejected",
      bondPoints: null,
      neglected: null,
      stability: { name: "Stability", before: 5, after: 4 },
    };
    expect(parseEstablishRecord(serializeEstablishRecord(rejected))).toEqual(
      rejected,
    );
  });

  it.each([
    ["missing", null],
    ["not JSON", "{"],
    ["not an object", "3"],
    ["a bad outcome", JSON.stringify({ ...record, outcome: "maybe" })],
    ["a bad change", JSON.stringify({ ...record, neglected: { name: "Mom" } })],
    ["no die", JSON.stringify({ ...record, die: undefined })],
  ])("rejects %s", (_, text) => {
    expect(parseEstablishRecord(text)).toBeNull();
  });
});
