import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cachedPer,
  createHookCounter,
  createHookStore,
  onHook,
  once,
} from "./hookStores";
import { stubHooks } from "./stubHooks";

describe("createHookStore", () => {
  let hooks: ReturnType<typeof stubHooks>;
  beforeEach(() => {
    hooks = stubHooks();
  });

  it("reads again when a hook it follows fires, if `when` agrees", () => {
    const live = { names: ["a"] };
    const store = createHookStore(
      () => ({ names: [...live.names] }),
      [onHook("updateActor", (actor) => actor.name === "ours")],
    );
    const listener = vi.fn();
    store.subscribe(listener);

    live.names.push("b");
    hooks.call("updateActor", { name: "theirs" });
    expect(listener).not.toHaveBeenCalled();
    hooks.call("updateActor", { name: "ours" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ names: ["a", "b"] });
  });

  it("keeps its identity while it reads the same", () => {
    const store = createHookStore(() => ({ names: ["a"] }), [onHook("ready")]);
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    hooks.call("ready");
    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops listening when nothing is subscribed", () => {
    const store = createHookStore(() => 1, [onHook("ready"), onHook("init")]);
    const unsubscribe = store.subscribe(vi.fn());
    expect(hooks.count()).toBe(2);
    unsubscribe();
    expect(hooks.count()).toBe(0);
  });
});

describe("createHookCounter", () => {
  it("goes up each time a hook it follows fires", () => {
    const hooks = stubHooks();
    const counter = createHookCounter([onHook("ready")]);
    const listener = vi.fn();
    counter.subscribe(listener);
    const before = counter.getSnapshot();
    hooks.call("ready");
    hooks.call("ready");
    expect(counter.getSnapshot()).toBe(before + 2);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("once", () => {
  it("creates the thing on the first call only", () => {
    const create = vi.fn(() => ({}));
    const get = once(create);
    expect(create).not.toHaveBeenCalled();
    expect(get()).toBe(get());
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("cachedPer", () => {
  it("creates one thing per key", () => {
    const create = vi.fn((key: { id: number }) => ({ for: key.id }));
    const get = cachedPer(create);
    const a = { id: 1 };
    const b = { id: 2 };
    expect(get(a)).toBe(get(a));
    expect(get(b)).not.toBe(get(a));
    expect(create).toHaveBeenCalledTimes(2);
  });
});
