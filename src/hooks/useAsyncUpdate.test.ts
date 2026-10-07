import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";

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
