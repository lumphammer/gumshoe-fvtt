import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { ItemWithTransitionState } from "./useListShowHideTransition";
import { useListShowHideTransition } from "./useListShowHideTransition";

function identity<T>(value: T): T {
  return value;
}

vi.useFakeTimers();

function renderUseListShowHideTransition(initialList: string[] = []) {
  return renderHook<ItemWithTransitionState<string>[], string[]>(
    (props) => useListShowHideTransition(props, identity, 50, 50),
    {
      initialProps: initialList,
    },
  );
}

function actAndAdvance(time: number) {
  act(() => {
    vi.advanceTimersByTime(time);
  });
}

describe("useListShowHideTransition", () => {
  test("should return the initial list as showing", () => {
    const { result } = renderUseListShowHideTransition(["foo", "bar"]);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
    ]);
  });
  test("should return a newly added item not showing, and then showing", () => {
    const { result, rerender } = renderUseListShowHideTransition([]);
    expect(result.current).toEqual([]);
    rerender(["foo"]);
    actAndAdvance(1);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: false,
        isEntering: true,
        key: "foo",
      },
    ]);
    actAndAdvance(50);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
    ]);
  });
  test("should transition things out and then remove removed items after the given period", () => {
    const { result, rerender } = renderUseListShowHideTransition([
      "foo",
      "bar",
    ]);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
    ]);
    rerender(["foo"]);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
    ]);
    actAndAdvance(1);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: false,
        isEntering: false,
        key: "bar",
      },
    ]);
    actAndAdvance(49);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
    ]);
  });
  test("should insert items in the right order", () => {
    const { result, rerender } = renderUseListShowHideTransition([
      "foo",
      "bar",
    ]);
    rerender(["foo", "bar", "baz"]);
    actAndAdvance(50);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    rerender(["foo", "corge", "bar", "baz"]);
    actAndAdvance(50);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "corge",
        isShowing: true,
        isEntering: true,
        key: "corge",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    rerender(["grault", "foo", "corge", "bar", "baz"]);
    actAndAdvance(50);
    expect(result.current).toEqual([
      {
        item: "grault",
        isShowing: true,
        isEntering: true,
        key: "grault",
      },
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "corge",
        isShowing: true,
        isEntering: true,
        key: "corge",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
  });
  test("should remove items in the right order", () => {
    const { result, rerender } = renderUseListShowHideTransition([
      "foo",
      "bar",
      "baz",
      "corge",
      "grault",
    ]);
    rerender(["foo", "bar", "baz", "corge"]);
    actAndAdvance(100);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
      {
        item: "corge",
        isShowing: true,
        isEntering: true,
        key: "corge",
      },
    ]);
    rerender(["foo", "baz", "corge"]);
    actAndAdvance(100);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
      {
        item: "corge",
        isShowing: true,
        isEntering: true,
        key: "corge",
      },
    ]);
    rerender(["baz", "corge"]);
    actAndAdvance(100);
    expect(result.current).toEqual([
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
      {
        item: "corge",
        isShowing: true,
        isEntering: true,
        key: "corge",
      },
    ]);
  });
  test("should add items with the right timing when adding items in a staggered fashion", () => {
    const { result, rerender } = renderUseListShowHideTransition([]);
    rerender(["foo"]);
    actAndAdvance(1);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: false,
        isEntering: true,
        key: "foo",
      },
    ]);
    actAndAdvance(20);
    rerender(["foo", "bar"]);
    actAndAdvance(1);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: false,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: false,
        isEntering: true,
        key: "bar",
      },
    ]);
    actAndAdvance(30);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: false,
        isEntering: true,
        key: "bar",
      },
    ]);
    actAndAdvance(50);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
    ]);
  });
  test("should remove items with the right timing when removing items in a staggered fashion", () => {
    const { result, rerender } = renderUseListShowHideTransition([
      "foo",
      "bar",
      "baz",
    ]);
    rerender(["foo", "baz"]);
    actAndAdvance(1);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: false,
        isEntering: false,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    //   actAndAdvance(24);
    //   rerender(["foo"]);
    //   actAndAdvance(1);
    //   expect(result.current).toEqual([
    //     {
    //       item: "foo",
    //       isShowing: true,
    //       isEntering: true,
    //       key: "foo",
    //     },
    //     {
    //       item: "bar",
    //       isShowing: false,
    //       isEntering: false,
    //       key: "bar",
    //     },
    //     {
    //       item: "baz",
    //       isShowing: true,
    //       isEntering: true,
    //       key: "baz",
    //     },
    //   ]);
    //   actAndAdvance(30);
    //   expect(result.current).toEqual([
    //     {
    //       item: "foo",
    //       isShowing: true,
    //       isEntering: true,
    //       key: "foo",
    //     },
    //     {
    //       item: "baz",
    //       isShowing: true,
    //       isEntering: true,
    //       key: "baz",
    //     },
    //   ]);
  });
  test("should keep track when an item is removed and then quickly re-added", () => {
    const { result, rerender } = renderUseListShowHideTransition([
      "foo",
      "bar",
      "baz",
    ]);
    actAndAdvance(100);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    rerender(["foo", "baz"]);
    actAndAdvance(25);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: false,
        isEntering: false,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    rerender(["foo", "bar", "baz"]);
    actAndAdvance(10);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
    actAndAdvance(15);
    expect(result.current).toEqual([
      {
        item: "foo",
        isShowing: true,
        isEntering: true,
        key: "foo",
      },
      {
        item: "bar",
        isShowing: true,
        isEntering: true,
        key: "bar",
      },
      {
        item: "baz",
        isShowing: true,
        isEntering: true,
        key: "baz",
      },
    ]);
  });
});
