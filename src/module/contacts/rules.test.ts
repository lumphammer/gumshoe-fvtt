import { describe, expect, it } from "vitest";

import type { ContactRecord } from "./rules";
import {
  getMaxAssignablePoints,
  getNetworkRefreshPool,
  parseContactRecord,
  serializeContactRecord,
} from "./rules";

describe("getNetworkRefreshPool", () => {
  it("leaves out what contacts hold", () => {
    // Network 5, Fred given 3 and tapped twice: the refresh brings it to 4
    expect(getNetworkRefreshPool({ rating: 5, contactPools: [1] })).toBe(4);
  });

  it("is the rating without contacts", () => {
    expect(getNetworkRefreshPool({ rating: 5, contactPools: [] })).toBe(5);
  });

  it("doesn't count exhausted contacts", () => {
    expect(getNetworkRefreshPool({ rating: 5, contactPools: [0, 2] })).toBe(3);
  });

  it("never goes below 0, e.g. after the rating comes down", () => {
    expect(getNetworkRefreshPool({ rating: 2, contactPools: [3] })).toBe(0);
  });
});

describe("getMaxAssignablePoints", () => {
  it("is Network's pool", () => {
    expect(getMaxAssignablePoints(3)).toBe(3);
  });

  it("is 0 when the pool is negative", () => {
    expect(getMaxAssignablePoints(-1)).toBe(0);
  });
});

describe("contact records", () => {
  const record: ContactRecord = {
    kind: "test",
    contactName: "Fred",
    location: "Bangkok",
    points: 2,
    die: 4,
    total: 6,
    poolBefore: 3,
    poolAfter: 1,
    networkName: null,
    networkBefore: null,
    networkAfter: null,
  };

  it("round-trip", () => {
    expect(parseContactRecord(serializeContactRecord(record))).toEqual(record);
  });

  it("round-trip an assignment", () => {
    const assign: ContactRecord = {
      ...record,
      kind: "assign",
      die: null,
      total: null,
      networkName: "Network",
      networkBefore: 5,
      networkAfter: 2,
    };
    expect(parseContactRecord(serializeContactRecord(assign))).toEqual(assign);
  });

  it.each([
    null,
    "",
    "not json",
    "null",
    JSON.stringify({ ...record, kind: "bribe" }),
    JSON.stringify({ ...record, poolAfter: "1" }),
    JSON.stringify({ ...record, die: "4" }),
    JSON.stringify({ ...record, contactName: undefined }),
  ])("reject %s", (text) => {
    expect(parseContactRecord(text)).toBeNull();
  });
});
