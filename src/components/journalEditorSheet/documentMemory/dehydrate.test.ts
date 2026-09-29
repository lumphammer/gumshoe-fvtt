import { expect, test, vi } from "vitest";

import { createDocumentMemory } from "./createDocumentMemory";
import { dehydrate } from "./dehydrate";
import { save } from "./save";
import { advanceTime10s, getAdditiveStates } from "./testHelpers";
import type { BareDocumentMemory, DocumentMemory } from "./types";

vi.setSystemTime(0);
let documentMemory = createDocumentMemory(3);
const states = getAdditiveStates(26);
for (let i = 0; i < states.length; i++) {
  documentMemory = save(documentMemory, states[i]);
  advanceTime10s();
}

test("removes state and snapshots", () => {
  const documentMemory: DocumentMemory = {
    stack: {
      edits: [],
      bombBay: [],
      next: null,
    },
    serial: 0,
    period: 0,
    maxDepth: 0,
    state: "",
    snapshots: [],
  };
  expect(dehydrate(documentMemory)).toEqual<BareDocumentMemory>({
    stack: {
      edits: [],
      bombBay: [],
      next: null,
    },
    serial: 0,
    period: 0,
    maxDepth: 0,
  });
});

test("saves space", () => {
  const jsonFull = JSON.stringify(documentMemory);
  const jsonDehydrated = JSON.stringify(dehydrate(documentMemory));
  expect(jsonDehydrated.length).toBeLessThan(jsonFull.length);
});
