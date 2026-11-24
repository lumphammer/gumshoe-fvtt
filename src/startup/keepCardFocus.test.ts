import { describe, expect, it } from "vitest";

import { chooseFocusTarget } from "./keepCardFocus";

describe("chooseFocusTarget", () => {
  it("finds the control with the same name", () => {
    expect(chooseFocusTarget("Cover", 1, ["Apply", "Roll", "Cover"])).toBe(2);
  });

  it("takes the nearest of several with the same name", () => {
    // each target has a Remove button: keep to the one that was focused
    expect(
      chooseFocusTarget("Remove target", 3, [
        "Remove target",
        "Cover",
        "x",
        "Remove target",
        "Cover",
      ]),
    ).toBe(3);
  });

  it("takes the control now in its place when it's gone", () => {
    expect(chooseFocusTarget("Gone", 1, ["Apply", "Roll", "Cover"])).toBe(1);
  });

  it("takes the last when there are fewer now", () => {
    expect(chooseFocusTarget("Gone", 5, ["Apply", "Roll"])).toBe(1);
  });

  it("gives up on a card with no controls", () => {
    expect(chooseFocusTarget("Gone", 0, [])).toBeNull();
  });
});
