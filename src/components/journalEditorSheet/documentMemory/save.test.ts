import { afterAll, beforeEach, expect, test, vi } from "vitest";

import type { DocumentMemory } from ".";
import { createDocumentMemory } from "./createDocumentMemory";
import { save } from "./save";
import { advanceTime10s, epoch, getAdditiveStates } from "./testHelpers";

beforeEach(() => {
  vi.setSystemTime(new Date(epoch));
});

afterAll(() => {
  vi.useRealTimers();
});

test("starts", () => {
  const h1 = createDocumentMemory(3, Number.MAX_SAFE_INTEGER);
  const h2 = save(h1, "foo");
  expect(h2).toEqual<DocumentMemory>({
    snapshots: [""],
    stack: {
      bombBay: [],
      edits: [
        {
          changes: [[1, "foo"]],
          timestamp: 0,
          serial: 1,
        },
      ],
      next: null,
    },
    serial: 1,
    period: 3,
    maxDepth: Number.MAX_SAFE_INTEGER,
    state: "foo",
  });
});

test("stores a sequence of edits", () => {
  let h = createDocumentMemory(3);
  const states = getAdditiveStates(3);
  for (const state of states) {
    h = save(h, state);
    advanceTime10s();
  }
  expect(h).toMatchSnapshot();
});

test("stores a sequence of edits onto the next stack", () => {
  let h = createDocumentMemory(3);
  const states = getAdditiveStates(6);
  for (const state of states) {
    h = save(h, state);
    advanceTime10s();
  }
  expect(h).toMatchSnapshot();
});

test("stores a sequence of edits onto the third stack", () => {
  let h = createDocumentMemory(3);
  const states = getAdditiveStates(21);
  for (const state of states) {
    h = save(h, state);
    advanceTime10s();
  }
  expect(h).toMatchSnapshot();
});

test("stores a sequence of edits that hits the depth limit", () => {
  let h = createDocumentMemory(3, 2);
  const states = getAdditiveStates(21);
  for (const state of states) {
    h = save(h, state);
    advanceTime10s();
  }
  const stacks: any[] = [];
  for (let stack: any = h.stack; stack; stack = stack.next) {
    stacks.push(stack);
  }

  expect(stacks.length).toEqual(2);
});

test("does not append history if the state is equal", () => {
  let h1 = createDocumentMemory(100);
  h1 = save(h1, "foo");
  h1 = save(h1, "bar");
  h1 = save(h1, "bax");
  h1 = save(h1, "corge");
  h1 = save(h1, "grault");
  expect(h1.stack.edits.length).toEqual(5);
  let h2 = createDocumentMemory(100);
  h2 = save(h2, "foo");
  h2 = save(h2, "foo");
  h2 = save(h2, "bar");
  h2 = save(h2, "bar");
  h2 = save(h2, "foo");
  expect(h2.stack.edits.length).toEqual(3);
});
