import { describe, expect, it } from "vitest";

import { getWoundStatusTransition } from "./woundStatus";

describe("getWoundStatusTransition", () => {
  it("does nothing when the wound state doesn't change", () => {
    expect(getWoundStatusTransition("ok", "ok")).toBeNull();
    expect(getWoundStatusTransition("hurt", "hurt")).toBeNull();
    expect(getWoundStatusTransition("dead", "dead")).toBeNull();
  });

  it("applies the new state's status and removes the others", () => {
    expect(getWoundStatusTransition("ok", "hurt")).toEqual({
      remove: ["seriouslyWounded", "dead"],
      add: "hurt",
    });
    expect(getWoundStatusTransition("hurt", "seriouslyWounded")).toEqual({
      remove: ["hurt", "dead"],
      add: "seriouslyWounded",
    });
    expect(getWoundStatusTransition("ok", "dead")).toEqual({
      remove: ["hurt", "seriouslyWounded"],
      add: "dead",
    });
  });

  it("removes everything when healed above 0", () => {
    expect(getWoundStatusTransition("dead", "ok")).toEqual({
      remove: ["hurt", "seriouslyWounded", "dead"],
      add: null,
    });
  });
});
