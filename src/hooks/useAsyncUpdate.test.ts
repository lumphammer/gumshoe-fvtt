import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { inputThrottleTime } from "../constants";
import { useAsyncUpdate } from "./useAsyncUpdate";

// this kinda restests the throttle function, but it's a good sanity check
it("should follow a typical scenario", () => {
  let state = "";
  const onChangeSpy = vi.fn((value: string) => {
    state = value;
  });
  vi.useFakeTimers();
  const { rerender, result } = renderHook(() =>
    useAsyncUpdate(state, onChangeSpy),
  );
  expect(result.current.display).toEqual("");
  const { onChange } = result.current;
  expect(onChangeSpy).not.toHaveBeenCalled();
  expect(result.current.display).toEqual("");
  onChange("foo");
  rerender();
  expect(result.current.display).toEqual("foo");
  expect(onChangeSpy).not.toHaveBeenCalled();
  vi.advanceTimersByTime(inputThrottleTime - 1);
  rerender();
  expect(result.current.display).toEqual("foo");
  expect(onChangeSpy).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  rerender();
  expect(result.current.display).toEqual("foo");
  expect(onChangeSpy).toHaveBeenCalledTimes(1);
  expect(onChangeSpy).toHaveBeenCalledWith("foo");
  vi.advanceTimersByTime(20);
  rerender();
  expect(result.current.display).toEqual("foo");
  onChange("bar");
  rerender();
  expect(result.current.display).toEqual("bar");
  vi.advanceTimersByTime(20);
  rerender();
  expect(result.current.display).toEqual("bar");
  onChange("baz");
  rerender();
  expect(result.current.display).toEqual("baz");
  vi.advanceTimersByTime(20);
  rerender();
  expect(result.current.display).toEqual("baz");
  onChange("qux");
  vi.advanceTimersByTime(inputThrottleTime - 20 - 20 - 20 - 1);
  rerender();
  expect(result.current.display).toEqual("qux");
  expect(onChangeSpy).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(1);
  rerender();
  expect(result.current.display).toEqual("qux");
  expect(onChangeSpy).toHaveBeenCalledTimes(2);
  expect(onChangeSpy).toHaveBeenCalledWith("qux");
});

it("saves a waiting change straight away on blur", () => {
  const onChangeSpy = vi.fn();
  vi.useFakeTimers();
  const { result } = renderHook(() => useAsyncUpdate("", onChangeSpy));
  result.current.onFocus();
  result.current.onChange("foo");
  expect(onChangeSpy).not.toHaveBeenCalled();
  // e.g. clicking a Save button straight after typing
  result.current.onBlur();
  expect(onChangeSpy).toHaveBeenCalledTimes(1);
  expect(onChangeSpy).toHaveBeenCalledWith("foo");
  vi.advanceTimersByTime(inputThrottleTime);
  expect(onChangeSpy).toHaveBeenCalledTimes(1);
});

it("saves a waiting change straight away on unmount", () => {
  const onChangeSpy = vi.fn();
  vi.useFakeTimers();
  const { result, unmount } = renderHook(() => useAsyncUpdate("", onChangeSpy));
  result.current.onChange("foo");
  unmount();
  expect(onChangeSpy).toHaveBeenCalledTimes(1);
  expect(onChangeSpy).toHaveBeenCalledWith("foo");
});

it("saves each change with the callback it was made with", async () => {
  vi.useFakeTimers();
  const saved: string[] = [];
  let finishFirst = () => undefined as void;
  const saveTo = (target: string) => (value: string) => {
    saved.push(`${target}:${value}`);
    if (saved.length === 1) {
      return new Promise<void>((resolve) => {
        finishFirst = resolve;
      });
    }
  };
  const { result, rerender } = renderHook(
    ({ save }) => useAsyncUpdate("", save),
    { initialProps: { save: saveTo("a") } },
  );
  result.current.onChange("one");
  await act(() => vi.advanceTimersByTimeAsync(inputThrottleTime));
  // the first save is out, so this one waits for it
  result.current.onChange("two");
  await act(() => vi.advanceTimersByTimeAsync(inputThrottleTime));
  // e.g. the input now edits another document
  rerender({ save: saveTo("b") });
  await act(async () => {
    finishFirst();
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(saved).toEqual(["a:one", "a:two"]);
  vi.useRealTimers();
});

describe("required", () => {
  /** a stored value which follows its saves, like a document */
  const setup = (initial: string) => {
    vi.useFakeTimers();
    let stored = initial;
    const save = vi.fn((value: string) => {
      stored = value;
    });
    const hook = renderHook(() =>
      useAsyncUpdate(stored, save, { required: true }),
    );
    const type = async (value: string) => {
      act(() => hook.result.current.onChange(value));
      await act(() => vi.advanceTimersByTimeAsync(inputThrottleTime));
      hook.rerender();
    };
    return { hook, save, type, stored: () => stored };
  };

  it("shows blank text but never saves it", async () => {
    const { hook, save, type } = setup("Jo");
    act(() => hook.result.current.onFocus());
    await type("J");
    await type("");
    await type("  ");
    expect(hook.result.current.display).toEqual("  ");
    expect(save.mock.calls).toEqual([["J"]]);
    vi.useRealTimers();
  });

  it("goes back to the value from the start of the edit if left blank", async () => {
    const { hook, save, type, stored } = setup("Jo");
    act(() => hook.result.current.onFocus());
    await type("J");
    await type("");
    act(() => hook.result.current.onBlur());
    hook.rerender();
    expect(hook.result.current.display).toEqual("Jo");
    expect(save).toHaveBeenLastCalledWith("Jo");
    expect(stored()).toEqual("Jo");
    vi.useRealTimers();
  });

  it("saves the start value after a part-deleted one still waiting", () => {
    const { hook, save } = setup("Jo");
    act(() => hook.result.current.onFocus());
    act(() => hook.result.current.onChange("J"));
    act(() => hook.result.current.onChange(""));
    act(() => hook.result.current.onBlur());
    expect(save.mock.calls).toEqual([["Jo"]]);
    vi.useRealTimers();
  });

  it("saves a new value typed after clearing", async () => {
    const { hook, save, type, stored } = setup("Jo");
    act(() => hook.result.current.onFocus());
    await type("");
    await type("Al");
    act(() => hook.result.current.onBlur());
    hook.rerender();
    expect(hook.result.current.display).toEqual("Al");
    expect(save.mock.calls).toEqual([["Al"]]);
    expect(stored()).toEqual("Al");
    vi.useRealTimers();
  });

  it("puts a contentEditable's text back", () => {
    const { hook } = setup("Jo");
    const element = document.createElement("div");
    hook.result.current.contentEditableRef.current = element;
    act(() => hook.result.current.onFocus());
    element.textContent = "";
    act(() => hook.result.current.onChange(""));
    act(() => hook.result.current.onBlur());
    expect(element.textContent).toEqual("Jo");
    vi.useRealTimers();
  });

  it("goes back on unmount if left blank", () => {
    const { hook, save } = setup("Jo");
    act(() => hook.result.current.onFocus());
    act(() => hook.result.current.onChange(""));
    hook.unmount();
    expect(save.mock.calls).toEqual([["Jo"]]);
    vi.useRealTimers();
  });

  it("saves blank text when not required", () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { result } = renderHook(() => useAsyncUpdate("Jo", save));
    act(() => result.current.onFocus());
    act(() => result.current.onChange(""));
    act(() => result.current.onBlur());
    expect(save.mock.calls).toEqual([[""]]);
    vi.useRealTimers();
  });
});
