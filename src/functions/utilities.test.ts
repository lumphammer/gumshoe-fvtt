import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import {
  debounce,
  fixLength,
  isNullOrEmptyString,
  memoizeNullaryOnce,
  moveKeyDown,
  moveKeyUp,
  renameProperty,
  sortByKey,
  sortEntitiesByName,
  throttle,
  trimLeadingPunctuation,
} from "./utilities";

const obj = {
  a: 1,
  b: 2,
  c: 3,
};

describe("moveKeyUp", () => {
  test.each([
    ["b", { b: 2, a: 1, c: 3 }],
    ["c", { a: 1, c: 3, b: 2 }],
  ])("move %s up", (key, expected) => {
    expect(JSON.stringify(moveKeyUp(obj, key))).toEqual(
      JSON.stringify(expected),
    );
  });
  test("move a up", () => {
    expect(() => moveKeyUp(obj, "a")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot move up from index 0]`,
    );
  });
});

describe("moveKeyDown", () => {
  test.each([
    ["b", { a: 1, c: 3, b: 2 }],
    ["a", { b: 2, a: 1, c: 3 }],
  ])("move %s down", (key, expected) => {
    expect(JSON.stringify(moveKeyDown(obj, key))).toEqual(
      JSON.stringify(expected),
    );
  });
  test("move c up", () => {
    expect(() => moveKeyDown(obj, "c")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot move down from last index]`,
    );
  });
});

describe("fixLength", () => {
  test.each([
    [null, 5, "xxxxx"],
    [undefined, 5, "xxxxx"],
    ["", 5, "xxxxx"],
    ["yy", 5, "yyxxx"],
    ["yyyyy", 5, "yyyyy"],
    ["yyyyyy", 5, "yyyyy"],
    ["knickers", 5, "knick"],
  ])("fixLength(%s)", (orig, n, expected) => {
    expect(fixLength(orig?.split(""), n, "x").join("")).toEqual(expected);
  });
});

describe("sortEntitiesByName", () => {
  test.each([
    [
      ["", ""],
      ["", ""],
    ],
    [
      ["a", "b"],
      ["a", "b"],
    ],
    [
      ["b", "a"],
      ["a", "b"],
    ],
    [
      ["a", "b", "c"],
      ["a", "b", "c"],
    ],
    [
      ["c", "b", "a"],
      ["a", "b", "c"],
    ],
    [
      ["a", null, "b"],
      [null, "a", "b"],
    ],
  ])("sortEntitiesByName(%s, %s)", (inputStrings, expected) => {
    const inputObjects = inputStrings.map((name) => ({ name }));
    const sorted = sortEntitiesByName(inputObjects);
    const outputStrings = sorted.map(({ name }) => name);
    expect(outputStrings).toEqual(expected);
  });
});

describe("isNullOrEmptyString", () => {
  test.each([
    [null, true],
    [undefined, true],
    ["", true],
    [" ", false],
    ["a", false],
  ])("isNullOrEmptyString(%s)", (input, expected) => {
    expect(isNullOrEmptyString(input)).toEqual(expected);
  });
});

describe("renameProperty", () => {
  test.each([
    [{ a: 1 }, "a", "b", { b: 1 }],
    [{ a: 1, b: 2 }, "a", "c", { c: 1, b: 2 }],
    [{ a: 1, b: 2 }, "b", "c", { a: 1, c: 2 }],
  ])("renameProperty(%s, %s, %s)", (input, oldName, newName, expected) => {
    expect(renameProperty(oldName, newName, input)).toEqual(expected);
  });
});

describe("memoizeNullaryOnce", () => {
  test("should not run the inner function when the memoized function is created", () => {
    const fn = vi.fn(() => "foo");
    memoizeNullaryOnce(fn);
    expect(fn).not.toHaveBeenCalled();
  });
  test("should run the inner function when the memoized function is called", () => {
    const fn = vi.fn(() => "foo");
    const memoized = memoizeNullaryOnce(fn);
    const result = memoized();
    expect(result).toEqual("foo");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  test("should not run the inner function again on subsequent calls", () => {
    const fn = vi.fn(() => "foo");
    const memoized = memoizeNullaryOnce(fn);
    const result1 = memoized();
    const result2 = memoized();
    const result3 = memoized();
    expect(result1).toEqual("foo");
    expect(result2).toEqual("foo");
    expect(result3).toEqual("foo");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("sortByKey", () => {
  test.each([
    ["empty", [], []],
    ["single", [{ name: "a" }], [{ name: "a" }]],
    ["no-op", [{ name: "a" }, { name: "b" }], [{ name: "a" }, { name: "b" }]],
    [
      "reversal",
      [{ name: "b" }, { name: "a" }],
      [{ name: "a" }, { name: "b" }],
    ],
    [
      "three",
      [{ name: "b" }, { name: "c" }, { name: "a" }],
      [{ name: "a" }, { name: "b" }, { name: "c" }],
    ],
  ])("string, %s", (name, input, expected) => {
    expect(sortByKey(input, "name")).toEqual(expected);
  });
  test.each([
    [
      "three",
      [{ name: 2 }, { name: 3 }, { name: 1 }],
      [{ name: 1 }, { name: 2 }, { name: 3 }],
    ],
  ])("number, %s", (name, input, expected) => {
    expect(sortByKey(input, "name")).toEqual(expected);
  });
});

describe("throttle", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  test("should do a simple call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(99);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  test("should handle multiple calls leading up to one execution", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(20);
    throttled(2);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(20);
    throttled(3);
    vi.advanceTimersByTime(59);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  test("should handle one execution, and then another one soon after", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    vi.advanceTimersByTime(20);
    throttled(2);
    vi.advanceTimersByTime(20);
    throttled(3);
    vi.advanceTimersByTime(59);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
    vi.advanceTimersByTime(20);
    throttled(4);
    vi.advanceTimersByTime(20);
    throttled(5);
    vi.advanceTimersByTime(59);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(5);
  });
  test("should handle one execution, and then another one after a long pause", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    vi.advanceTimersByTime(20);
    throttled(2);
    vi.advanceTimersByTime(20);
    throttled(3);
    vi.advanceTimersByTime(59);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
    vi.advanceTimersByTime(10000);
    throttled(4);
    vi.advanceTimersByTime(20);
    throttled(5);
    vi.advanceTimersByTime(20);
    throttled(6);
    vi.advanceTimersByTime(59);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(6);
  });
  test("should only call the function once per interval", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    throttled(2);
    throttled(3);
    throttled(4);
    throttled(5);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(99);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(5);
    throttled(6);
    throttled(7);
    throttled(8);
    throttled(9);
    throttled(10);
    vi.advanceTimersByTime(99);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(10);
  });
});

describe("debounce", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  test("should only call the function after the interval has elapsed", () => {
    const fn = vi.fn();
    const throttled = debounce(fn, 100);
    throttled();
    throttled();
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    throttled();
    throttled();
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("trimLeadingPunctuation", () => {
  test("return the same string if there's no punctuation", () => {
    expect(trimLeadingPunctuation("foo")).toBe("foo");
  });

  test("removes leading whitespace", () => {
    expect(trimLeadingPunctuation(" foo")).toBe("foo");
    expect(trimLeadingPunctuation("\tfoo")).toBe("foo");
    expect(trimLeadingPunctuation("\nfoo")).toBe("foo");
    expect(trimLeadingPunctuation("\r\nfoo")).toBe("foo");
  });

  test("removes leading punctuation", () => {
    expect(trimLeadingPunctuation("!foo")).toBe("foo");
    expect(trimLeadingPunctuation("?foo")).toBe("foo");
    expect(trimLeadingPunctuation(";foo")).toBe("foo");
    expect(trimLeadingPunctuation(":foo")).toBe("foo");
    expect(trimLeadingPunctuation("-foo")).toBe("foo");
    expect(trimLeadingPunctuation('"foo')).toBe("foo");
  });

  test("removes leading multiplepunctuation", () => {
    expect(trimLeadingPunctuation("!!foo")).toBe("foo");
    expect(trimLeadingPunctuation("??foo")).toBe("foo");
    expect(trimLeadingPunctuation(";;foo")).toBe("foo");
    expect(trimLeadingPunctuation("::foo")).toBe("foo");
    expect(trimLeadingPunctuation("--foo")).toBe("foo");
    expect(trimLeadingPunctuation('""foo')).toBe("foo");
  });
});
