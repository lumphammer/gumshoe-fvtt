import { beforeEach, expect, test, vi } from "vitest";

import { createDocumentMemory } from "./createDocumentMemory";
import { getAccessibleEdits } from "./getAccessibleEdits";
import { save } from "./save";
import { advanceTime10s, epoch, getAdditiveStates } from "./testHelpers";

beforeEach(() => {
  vi.setSystemTime(new Date(epoch));
});

test("getAccessibleEdits: no edits", () => {
  const memory = createDocumentMemory(3);
  const edits = getAccessibleEdits(memory);
  expect(edits).toEqual([]);
});

test.each(Array.from({ length: 20 }, (_, i) => i + 1))(
  "getAccessibleEdits: %i edits",
  (i) => {
    let memory = createDocumentMemory(3);
    const states = getAdditiveStates(i);
    for (const state of states) {
      memory = save(memory, state);
      advanceTime10s();
    }
    const edits = getAccessibleEdits(memory);
    expect(edits).toMatchSnapshot();
  },
);
