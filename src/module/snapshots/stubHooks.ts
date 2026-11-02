import { vi } from "vitest";

type Handler = (...args: unknown[]) => void;

/**
 * For tests: a stand-in for Foundry's `Hooks`, with a way to call a hook, and
 * to count the handlers still listening.
 */
export function stubHooks() {
  const handlers = new Map<number, { hook: string; fn: Handler }>();
  let nextId = 1;
  vi.stubGlobal("Hooks", {
    on: (hook: string, fn: Handler) => {
      handlers.set(nextId, { hook, fn });
      return nextId++;
    },
    off: (_hook: string, id: number) => handlers.delete(id),
  });
  return {
    call: (hook: string, ...args: unknown[]) => {
      for (const handler of [...handlers.values()]) {
        if (handler.hook === hook) handler.fn(...args);
      }
    },
    count: () => handlers.size,
  };
}
