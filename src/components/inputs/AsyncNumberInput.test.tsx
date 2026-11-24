import { act, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { inputThrottleTime } from "../../constants";
import { isNullOrEmptyString } from "../../functions/utilities";
import { AsyncNumberInput } from "./AsyncNumberInput";

// the buttons' names
vi.mock("../../functions/getTranslated", () => ({
  getTranslated: (text: string) => text,
}));

// set up uiser interactions
const user = userEvent.setup({
  // this *should* be how you tell user-event to use vitest's fake timers, but
  // see `vitest.setup.js` in this repo for a hacky workaround to a user-event
  // bug
  advanceTimers: vi.advanceTimersByTime,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("should show input value and call onChange eventually", async () => {
  const onChange = vi.fn();
  const { getByRole } = render(
    <AsyncNumberInput value={2} onChange={onChange} />,
  );
  const input = getByRole("textbox");
  input.focus();
  await user.keyboard("{backspace}123");
  expect(getByRole("textbox").getAttribute("value")).toBe("123");
  expect(onChange).toHaveBeenCalledTimes(0);
  vi.advanceTimersByTime(inputThrottleTime - 1);
  expect(onChange).toHaveBeenCalledTimes(0);
  vi.advanceTimersByTime(1);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(123);
});

describe.each<[string, string, string | undefined, string | undefined]>([
  ["too high", "11", undefined, "10"],
  ["too high", "99", undefined, "10"],
  ["too high", Number.MAX_SAFE_INTEGER.toString(), undefined, "10"],
  ["too high", "0", undefined, "-1"],
  ["too high", "-100", undefined, "-200"],
  ["too high", "100", undefined, "-200"],
  ["too high", Number.MAX_SAFE_INTEGER.toString(), undefined, "-200"],
  ["too low", "-1", "0", undefined],
  ["too low", Number.MIN_SAFE_INTEGER.toString(), "0", undefined],
  ["too low", "0", "1", undefined],
  ["too low", "100", "200", undefined],
])("when input is %s (input %s, min %s, max %s)", (_, input, min, max) => {
  async function setup() {
    const onChange = vi.fn();
    const { getByRole } = render(
      <AsyncNumberInput
        value={2}
        onChange={onChange}
        min={isNullOrEmptyString(min) ? undefined : Number(min)}
        max={isNullOrEmptyString(max) ? undefined : Number(max)}
        className="test"
      />,
    );
    const inputEl = getByRole("textbox");
    inputEl.focus();
    await user.keyboard("{backspace}" + input);
    return { inputEl, onChange };
  }

  it("should enter error mode", async () => {
    const { inputEl, onChange } = await setup();
    expect(inputEl.getAttribute("value")).toBe(input);
    expect(onChange).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(inputThrottleTime * 2);
    expect(onChange).toHaveBeenCalledTimes(0);
  });
  it("should show error state", async () => {
    const { inputEl } = await setup();
    expect(inputEl).toHaveAttribute("aria-invalid", "true");
  });
});

/**
 * A pretend server: each save is stored, and comes back as `value`, after
 * `latency` ms, the way a Foundry update does. Like Foundry, a save that's the
 * same as what the client has is dropped as no change. `store` can change
 * (e.g. clamp) what's stored. With `freshCallbacks`, each render passes a new
 * `onChange` (as a parent that makes them inline would).
 */
function renderWithServer({
  initial,
  latency,
  store = (value) => value,
  freshCallbacks = false,
}: {
  initial: number;
  latency: number;
  store?: (value: number) => number;
  freshCallbacks?: boolean;
}) {
  const server = { value: initial, saves: [] as number[] };
  // set once it's rendered
  let echo: (value: number) => void = () => undefined;
  const onChange = (value: number) => {
    if (value === server.value) return Promise.resolve();
    server.saves.push(value);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        server.value = store(value);
        echo(server.value);
        resolve();
      }, latency);
    });
  };
  const element = (value: number) => (
    <AsyncNumberInput
      value={value}
      onChange={freshCallbacks ? (v) => onChange(v) : onChange}
    />
  );
  const result = render(element(server.value));
  echo = (value) => {
    result.rerender(element(value));
  };
  const shown: string[] = [];
  const advance = async (ms: number) => {
    for (let t = 0; t < ms; t += 50) {
      await act(() => vi.advanceTimersByTimeAsync(50));
      const value = result.getByRole("textbox").getAttribute("value")!;
      if (shown.at(-1) !== value) shown.push(value);
    }
  };
  const click = (index: number) => {
    fireEvent.click(result.container.querySelectorAll("button")[index]);
  };
  const clickMinus = () => click(0);
  const clickPlus = () => click(1);
  return { server, shown, advance, clickPlus, clickMinus, result };
}

describe.each([
  [100, 300, false],
  [150, 300, false],
  [250, 300, false],
  [300, 600, false],
  [200, 1000, false],
  [250, 300, true],
  [200, 1000, true],
])(
  "six quick clicks on + (%ims apart, %ims latency, fresh callbacks: %s)",
  (gap, latency, freshCallbacks) => {
    it("saves them all, and only counts up", async () => {
      const { server, shown, advance, clickPlus } = renderWithServer({
        initial: 10,
        latency,
        freshCallbacks,
      });
      for (let i = 0; i < 6; i++) {
        clickPlus();
        await advance(gap);
      }
      await advance(inputThrottleTime + latency * 3);
      expect(server.value).toBe(16);
      expect(shown).toEqual(["11", "12", "13", "14", "15", "16"]);
    });
  },
);

it("shows what was stored, once the saves are done", async () => {
  const { server, shown, advance, clickPlus } = renderWithServer({
    initial: 10,
    latency: 300,
    // e.g. a rating cap the input doesn't know about
    store: (value) => Math.min(value, 11),
  });
  clickPlus();
  await advance(100);
  clickPlus();
  await advance(2000);
  expect(server.value).toBe(11);
  expect(shown).toEqual(["11", "12", "11"]);
});

it("follows changes from elsewhere when it has none of its own", () => {
  const onChange = vi.fn();
  const { getByRole, rerender } = render(
    <AsyncNumberInput value={2} onChange={onChange} />,
  );
  rerender(<AsyncNumberInput value={5} onChange={onChange} />);
  expect(getByRole("textbox").getAttribute("value")).toBe("5");
});

it("undoes a change that's still being saved", async () => {
  const { server, shown, advance, clickPlus, clickMinus } = renderWithServer({
    initial: 10,
    latency: 1000,
  });
  clickPlus();
  // the save for 11 is out
  await advance(600);
  clickMinus();
  await advance(4000);
  expect(server.value).toBe(10);
  expect(shown).toEqual(["11", "10"]);
});

it("stops waiting for a save that never comes back", async () => {
  const onChange = vi.fn(() => new Promise<void>(() => undefined));
  const { getByRole, container, rerender } = render(
    <AsyncNumberInput value={2} onChange={onChange} />,
  );
  fireEvent.click(container.querySelectorAll("button")[1]);
  await act(() => vi.advanceTimersByTimeAsync(inputThrottleTime));
  expect(onChange).toHaveBeenCalledWith(3);
  rerender(<AsyncNumberInput value={7} onChange={onChange} />);
  expect(getByRole("textbox").getAttribute("value")).toBe("3");
  await act(() => vi.advanceTimersByTimeAsync(10_000));
  expect(getByRole("textbox").getAttribute("value")).toBe("7");
});
