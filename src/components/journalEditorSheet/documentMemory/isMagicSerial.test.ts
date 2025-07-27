import { describe, expect, test } from "vitest";

import { isMagicSerial } from "./isMagicSerial";

function describePeriod(period: number, testData: Array<[number, number[]]>) {
  describe(`Period: ${period}`, () => {
    test.each(testData)("Depth: %i", (depth, magicNumbers) => {
      const actual: number[] = [];
      for (let i = 0; i <= Math.max(...magicNumbers); i++) {
        if (isMagicSerial(period, depth, i)) {
          actual.push(i);
        }
      }
      expect(actual).toEqual(magicNumbers); //
    });
  });
}

describe("isMagicSerial", () => {
  describePeriod(3, [
    // goes up in 3s, offset by (3^1) * 2 = 3
    [1, [6, 9, 12, 15, 18, 21, 24, 27, 30]],
    // goes up in 9s, offset by (3^2)*2 + 3^1 = 21
    [2, [21, 30, 39, 48, 57, 66, 75, 84, 93]],
    [3, [66, 93, 120, 147, 174, 201, 228, 255, 282]],
    [4, [201, 282, 363, 444, 525, 606, 687, 768, 849]],
    [5, [606, 849, 1092, 1335, 1578, 1821, 2064, 2307, 2550]],
    [6, [1821, 2550, 3279, 4008, 4737, 5466, 6195, 6924, 7653]],
  ]);
  describePeriod(100, [
    [1, [200, 300, 400, 500, 600, 700, 800, 900]],
    [2, [20_100, 30_100, 40_100, 50_100, 60_100, 70_100, 80_100]],
    [3, [2_010_100]],
    // gets a bit too slow at this point but you get the idea
    // [4, [201010100, 301010100, 401010100, 501010100]],
  ]);
});
