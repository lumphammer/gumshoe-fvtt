import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OnChange } from "./createSnapshotStore";
import { createSnapshotStore, watchGraceMs } from "./createSnapshotStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it("watches from when it's made, for a while", () => {
    const { store, watch, unwatch } = setUp();
    store.getSnapshot();
    expect(watch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(watchGraceMs);
    expect(unwatch).toHaveBeenCalledTimes(1);
  });

  it("watches while subscribed, and for a while after", () => {
    const { store, watch, unwatch } = setUp();
    const unsubscribeA = store.subscribe(vi.fn());
    const unsubscribeB = store.subscribe(vi.fn());
    vi.advanceTimersByTime(watchGraceMs * 2);
    expect(watch).toHaveBeenCalledTimes(1);
    expect(unwatch).not.toHaveBeenCalled();
    unsubscribeA();
    unsubscribeB();
    vi.advanceTimersByTime(watchGraceMs - 1);
    expect(unwatch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(unwatch).toHaveBeenCalledTimes(1);
  });

  it("reads once for many reads with nothing subscribed, and once to subscribe", () => {
    const read = vi.fn(() => ({ a: 1 }));
    const store = createSnapshotStore(read, () => () => undefined);
    vi.advanceTimersByTime(watchGraceMs);
    read.mockClear();
    for (let i = 0; i < 10; i++) store.getSnapshot();
    expect(read).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 10; i++) store.subscribe(vi.fn());
    expect(read).toHaveBeenCalledTimes(2);
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

  it("follows changes while nothing is subscribed", () => {
    const { live, store, change } = setUp();
    const before = store.getSnapshot();
    expect(store.getSnapshot()).toBe(before);
    live.a.x = 9;
    change();
    expect(store.getSnapshot().a).toEqual({ x: 9 });
    expect(store.getSnapshot().b).toBe(before.b);
  });

  it("reads again once it has stopped watching", () => {
    const { live, store } = setUp();
    const before = store.getSnapshot();
    vi.advanceTimersByTime(watchGraceMs);
    live.a.x = 9;
    expect(store.getSnapshot().a).toEqual({ x: 9 });
    expect(store.getSnapshot().b).toBe(before.b);
  });

  it("reads again for its first subscriber, even while still watching", () => {
    const { live, store } = setUp();
    store.subscribe(vi.fn())();
    // a change its hooks missed, while the store was still watching
    live.a.x = 8;
    store.subscribe(vi.fn());
    expect(store.getSnapshot().a).toEqual({ x: 8 });
    live.a.x = 9;
    store.subscribe(vi.fn());
    expect(store.getSnapshot().a).toEqual({ x: 8 });
  });

  it("keeps its wait when read, and starts it again when left", () => {
    const { store, unwatch } = setUp();
    vi.advanceTimersByTime(watchGraceMs - 1);
    store.getSnapshot();
    vi.advanceTimersByTime(1);
    expect(unwatch).toHaveBeenCalledTimes(1);
    store.getSnapshot();
    vi.advanceTimersByTime(watchGraceMs - 1);
    store.subscribe(vi.fn())();
    vi.advanceTimersByTime(watchGraceMs - 1);
    expect(unwatch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(unwatch).toHaveBeenCalledTimes(2);
  });

  it("catches up on changes made before subscribing", () => {
    const { live, store } = setUp();
    vi.advanceTimersByTime(watchGraceMs);
    live.a.x = 5;
    store.subscribe(vi.fn());
    expect(store.getSnapshot().a).toEqual({ x: 5 });
  });

  it("starts watching again after being unsubscribed", () => {
    const { live, store, watch, change } = setUp();
    store.subscribe(vi.fn())();
    vi.advanceTimersByTime(watchGraceMs);
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
