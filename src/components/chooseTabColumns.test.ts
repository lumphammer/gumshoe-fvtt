import { describe, expect, it } from "vitest";

import { chooseTabColumns } from "./chooseTabColumns";

describe("chooseTabColumns", () => {
  it("keeps one row when the tabs and spacers fit", () => {
    expect(chooseTabColumns([100, 100, 100], 20, 5, 320)).toBeNull();
  });

  it("allows for the spacers in one row", () => {
    expect(chooseTabColumns([100, 100, 100], 20, 5, 319)).toBe(2);
  });

  it("ignores a fraction of a pixel too wide", () => {
    expect(chooseTabColumns([100, 100, 100.4], 20, 5, 320)).toBeNull();
  });

  it("balances the rows: seven tabs are four and three", () => {
    expect(chooseTabColumns(Array(7).fill(100), 30, 5, 500)).toBe(4);
  });

  it("uses more rows when two don't fit", () => {
    // four columns need 415, three need 310
    expect(chooseTabColumns(Array(7).fill(100), 30, 5, 400)).toBe(3);
  });

  it("sizes each column by its widest tab", () => {
    // in four columns, the 200 is in the first, with a 50 under it: columns
    // of 200, 50, 50 and 50, plus gaps of 15
    expect(chooseTabColumns([200, 50, 50, 50, 50, 50, 50], 30, 5, 365)).toBe(4);
    expect(chooseTabColumns([200, 50, 50, 50, 50, 50, 50], 30, 5, 364)).toBe(3);
  });

  it("falls back to one column", () => {
    expect(chooseTabColumns([100, 100, 100], 10, 5, 150)).toBe(1);
  });
});
