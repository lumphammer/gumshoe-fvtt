import { describe, expect, test } from "vitest";

import { getAdditiveStates } from "./testHelpers";

describe("getAdditiveStates", () => {
  test.each(Array.from({ length: 9 }, (_, i) => i + 1))(
    "getStates: %i states",
    (i) => {
      expect(getAdditiveStates(i)).toMatchSnapshot();
    },
  );
  test.each([0, -1, -100, 27, 100])(
    "getStates: %i states should throw",
    (i) => {
      expect(() => getAdditiveStates(i)).toThrowError(
        "count must be between 1 and 26",
      );
    },
  );
});

describe("Vitest expect.closeTo", () => {
  test("0.1 + 0.2", () => {
    const result = 0.1 + 0.2;
    expect(result).not.toEqual(0.3);
    expect(result).toEqual(expect.closeTo(0.3, 5));
  });
  test("0.3 + 0.6", () => {
    const result = 0.3 + 0.6;
    expect(result).not.toEqual(0.9);
    expect(result).toEqual(expect.closeTo(0.9, 5));
  });
});
