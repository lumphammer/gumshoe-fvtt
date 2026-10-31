import { describe, expect, it } from "vitest";

import { replaceEqualDeep } from "./replaceEqualDeep";

describe("replaceEqualDeep", () => {
  it("returns prev when nothing changed", () => {
    const prev = { a: 1, b: { c: [1, 2, { d: "x" }] } };
    const next = structuredClone(prev);
    expect(replaceEqualDeep(prev, next)).toBe(prev);
  });

  it("keeps unchanged siblings and replaces changed paths", () => {
    const prev = { a: { x: 1 }, b: { y: 2 }, c: [{ z: 3 }, { z: 4 }] };
    const next = structuredClone(prev);
    next.b.y = 5;
    next.c[1].z = 6;
    const result = replaceEqualDeep(prev, next);
    expect(result).toEqual(next);
    expect(result).not.toBe(prev);
    expect(result.a).toBe(prev.a);
    expect(result.b).not.toBe(prev.b);
    expect(result.c).not.toBe(prev.c);
    expect(result.c[0]).toBe(prev.c[0]);
    expect(result.c[1]).not.toBe(prev.c[1]);
  });

  it("notices added and removed keys", () => {
    const prev: Record<string, unknown> = { a: 1, b: 2 };
    expect(replaceEqualDeep(prev, { a: 1 })).toEqual({ a: 1 });
    expect(replaceEqualDeep(prev, { a: 1, b: 2, c: 3 })).not.toBe(prev);
    // same key count, different keys
    expect(replaceEqualDeep(prev, { a: 1, c: 2 })).toEqual({ a: 1, c: 2 });
    // a key present with undefined is not the same as a missing key
    expect(replaceEqualDeep({ a: 1 }, { a: 1, b: undefined })).toEqual({
      a: 1,
      b: undefined,
    });
  });

  it("notices array length changes", () => {
    const prev = [1, 2, 3];
    expect(replaceEqualDeep(prev, [1, 2])).toEqual([1, 2]);
    expect(replaceEqualDeep(prev, [1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("matches embedded documents by _id", () => {
    const prev = [
      { _id: "a", v: 1 },
      { _id: "b", v: 2 },
      { _id: "c", v: 3 },
    ];
    const next = structuredClone([prev[0], prev[2]]);
    const result = replaceEqualDeep(prev, next);
    expect(result).toEqual(next);
    expect(result[0]).toBe(prev[0]);
    expect(result[1]).toBe(prev[2]);
  });

  it("compares non-plain values by identity", () => {
    const date = new Date(0);
    const prev = { d: date, n: Number.NaN };
    expect(replaceEqualDeep(prev, { d: date, n: Number.NaN })).toBe(prev);
    expect(replaceEqualDeep(prev, { d: new Date(0), n: Number.NaN })).not.toBe(
      prev,
    );
  });
});
