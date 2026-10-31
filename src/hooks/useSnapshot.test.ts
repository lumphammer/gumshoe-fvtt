import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OnChange } from "../module/snapshots/createSnapshotStore";
import { createSnapshotStore } from "../module/snapshots/createSnapshotStore";
import { useSnapshotSelector } from "./useSnapshot";

function setUp() {
  const live = { a: { x: 1 }, b: { y: 2 } };
  let onChange: OnChange<typeof live> = () => undefined;
  const store = createSnapshotStore(
    () => structuredClone(live),
    (fn) => {
      onChange = fn;
      return () => undefined;
    },
  );
  return { live, store, change: () => act(() => onChange()) };
}

describe("useSnapshotSelector", () => {
  it("keeps a built result's identity while its contents are the same", () => {
    const { live, store, change } = setUp();
    const render = vi.fn();
    const { result } = renderHook(() => {
      render();
      // a new object every time
      return useSnapshotSelector(store, (s) => ({ x: s.a.x }));
    });
    const first = result.current;
    const renders = render.mock.calls.length;

    // a change elsewhere: same result, no re-render
    live.b.y = 3;
    change();
    expect(result.current).toBe(first);
    expect(render.mock.calls.length).toBe(renders);

    // a change to what it selects
    live.a.x = 4;
    change();
    expect(result.current).toEqual({ x: 4 });
    expect(render.mock.calls.length).toBe(renders + 1);
  });

  it("follows values from the component", () => {
    const { store } = setUp();
    const { result, rerender } = renderHook(
      ({ key }: { key: "a" | "b" }) =>
        useSnapshotSelector(store, (s) => s[key]),
      { initialProps: { key: "a" as "a" | "b" } },
    );
    expect(result.current).toEqual({ x: 1 });
    rerender({ key: "b" });
    expect(result.current).toEqual({ y: 2 });
  });
});
