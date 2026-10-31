import { describe, expect, it, vi } from "vitest";

import type { OnChange } from "./createSnapshotStore";
import { createSnapshotStore } from "./createSnapshotStore";

/** Some mutable data, and a way to say it changed. */
function setUp() {
  const live = { a: { x: 1 }, b: { y: 2 } };
  let onChange: (() => void) | null = null;
  const unwatch = vi.fn(() => {
    onChange = null;
  });
  const watch = vi.fn((fn: () => void) => {
    onChange = fn;
    return unwatch;
  });
  const store = createSnapshotStore(() => structuredClone(live), watch);
  return {
    live,
    store,
    watch,
    unwatch,
    change: () => onChange?.(),
  };
}

describe("createSnapshotStore", () => {
  it("snapshots the data, as a copy", () => {
    const { live, store } = setUp();
    expect(store.getSnapshot()).toEqual(live);
    expect(store.getSnapshot()).not.toBe(live);
  });

  it("only watches while subscribed", () => {
    const { store, watch, unwatch } = setUp();
    expect(watch).not.toHaveBeenCalled();
    const unsubscribeA = store.subscribe(vi.fn());
    const unsubscribeB = store.subscribe(vi.fn());
    expect(watch).toHaveBeenCalledTimes(1);
    unsubscribeA();
    expect(unwatch).not.toHaveBeenCalled();
    unsubscribeB();
    expect(unwatch).toHaveBeenCalledTimes(1);
  });

  it("shares what didn't change, and notifies", () => {
    const { live, store, change } = setUp();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    live.b.y = 3;
    change();
    const after = store.getSnapshot();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(after).not.toBe(before);
    expect(after.a).toBe(before.a);
    expect(after.b).toEqual({ y: 3 });
  });

  it("doesn't notify when nothing changed", () => {
    const { store, change } = setUp();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    change();
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
  });

  it("is up to date while nothing is subscribed", () => {
    const { live, store } = setUp();
    const before = store.getSnapshot();
    expect(store.getSnapshot()).toBe(before);
    live.a.x = 9;
    expect(store.getSnapshot().a).toEqual({ x: 9 });
    expect(store.getSnapshot().b).toBe(before.b);
  });

  it("catches up on changes made before subscribing", () => {
    const { live, store } = setUp();
    live.a.x = 5;
    store.subscribe(vi.fn());
    expect(store.getSnapshot().a).toEqual({ x: 5 });
  });

  it("starts watching again after being unsubscribed", () => {
    const { live, store, watch, change } = setUp();
    store.subscribe(vi.fn())();
    live.a.x = 6;
    const listener = vi.fn();
    store.subscribe(listener);
    expect(watch).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().a).toEqual({ x: 6 });
    live.a.x = 7;
    change();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("createSnapshotStore updates", () => {
  it("applies an update to the current snapshot, sharing the rest", () => {
    const live = {
      a: { x: 1 },
      list: [
        { _id: "p", v: 1 },
        { _id: "q", v: 2 },
      ],
    };
    let onChange: OnChange<typeof live> = () => undefined;
    const store = createSnapshotStore(
      () => structuredClone(live),
      (fn) => {
        onChange = fn;
        return () => undefined;
      },
    );
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    onChange((previous) => ({
      ...previous,
      list: [previous.list[0], { _id: "q", v: 3 }],
    }));
    const after = store.getSnapshot();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(after.a).toBe(before.a);
    expect(after.list[0]).toBe(before.list[0]);
    expect(after.list[1]).toEqual({ _id: "q", v: 3 });
  });
});
