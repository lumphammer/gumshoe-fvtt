import { describe, expect, it, vi } from "vitest";

import {
  clearActiveSituationalModifiers,
  getActiveSituationalModifiers,
  subscribeToActiveSituationalModifiers,
  toggleActiveSituationalModifier,
} from "./activeSituationalModifiers";

describe("active situational modifiers", () => {
  it("toggles per ability, notifies, and clears", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToActiveSituationalModifiers(listener);
    const before = getActiveSituationalModifiers("Item.a");
    expect(before).toEqual([]);
    // unchanged reads are the same array, for useSyncExternalStore
    expect(getActiveSituationalModifiers("Item.a")).toBe(before);

    toggleActiveSituationalModifier("Item.a", "dark");
    toggleActiveSituationalModifier("Item.a", "wet");
    toggleActiveSituationalModifier("Item.b", "dark");
    expect(getActiveSituationalModifiers("Item.a")).toEqual(["dark", "wet"]);
    toggleActiveSituationalModifier("Item.a", "dark");
    expect(getActiveSituationalModifiers("Item.a")).toEqual(["wet"]);
    expect(getActiveSituationalModifiers("Item.b")).toEqual(["dark"]);
    expect(listener).toHaveBeenCalledTimes(4);

    clearActiveSituationalModifiers("Item.a");
    expect(getActiveSituationalModifiers("Item.a")).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(5);
    unsubscribe();
    clearActiveSituationalModifiers("Item.b");
    expect(listener).toHaveBeenCalledTimes(5);
  });
});
