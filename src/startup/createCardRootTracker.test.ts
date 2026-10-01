import { describe, expect, it, vi } from "vitest";

import { createCardRootTracker } from "./createCardRootTracker";

function setup() {
  let pending: (() => void) | null = null;
  const schedule = vi.fn((callback: () => void) => {
    pending = callback;
  });
  const runScheduled = () => {
    const callback = pending;
    pending = null;
    callback?.();
  };
  const tracker = createCardRootTracker(schedule);
  const makeCard = (isConnected: boolean) => ({
    el: { isConnected },
    root: { unmount: vi.fn() },
  });
  return { tracker, schedule, runScheduled, makeCard };
}

describe("createCardRootTracker", () => {
  it("unmounts a card which was in the page and then removed", () => {
    const { tracker, runScheduled, makeCard } = setup();
    const card = makeCard(true);
    tracker.track(card.el, card.root);
    runScheduled();

    card.el.isConnected = false;
    tracker.scheduleSweep();
    runScheduled();

    expect(card.root.unmount).toHaveBeenCalledOnce();
    expect(tracker.size).toBe(0);
  });

  it("leaves a card alone which hasn't been put in the page yet", () => {
    const { tracker, runScheduled, makeCard } = setup();
    const card = makeCard(false);
    tracker.track(card.el, card.root);
    runScheduled();
    tracker.scheduleSweep();
    runScheduled();

    expect(card.root.unmount).not.toHaveBeenCalled();
    expect(tracker.size).toBe(1);
  });

  it("swaps an updated card: unmounts the old, keeps the new", () => {
    const { tracker, runScheduled, makeCard } = setup();
    const oldCard = makeCard(true);
    tracker.track(oldCard.el, oldCard.root);
    runScheduled();

    // Foundry renders the new element (our hook runs before it's inserted)
    // and then replaces the old one with it, before our sweep runs
    const newCard = makeCard(false);
    tracker.track(newCard.el, newCard.root);
    oldCard.el.isConnected = false;
    newCard.el.isConnected = true;
    runScheduled();

    expect(oldCard.root.unmount).toHaveBeenCalledOnce();
    expect(newCard.root.unmount).not.toHaveBeenCalled();
    expect(tracker.size).toBe(1);
  });

  it("only schedules one sweep at a time", () => {
    const { tracker, schedule, makeCard } = setup();
    const a = makeCard(false);
    const b = makeCard(false);
    tracker.track(a.el, a.root);
    tracker.track(b.el, b.root);
    expect(schedule).toHaveBeenCalledOnce();
  });
});
