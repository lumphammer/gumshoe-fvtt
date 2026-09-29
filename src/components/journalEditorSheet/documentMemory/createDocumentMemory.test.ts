import { describe, expect, test } from "vitest";

import { createDocumentMemory } from "./createDocumentMemory";
import type { DocumentMemory } from "./types";

describe("createDocumentMemory", () => {
  test.each([3, 4, 5, 6, 100, 1000])(
    "creates an empty memory with period %i and no maxDepth",
    (period) => {
      const memory = createDocumentMemory(period);
      expect(memory).toEqual<DocumentMemory>({
        stack: {
          edits: [],
          bombBay: [],
          next: null,
        },
        serial: 0,
        period,
        maxDepth: null,
        snapshots: [""],
        state: "",
      });
    },
  );
  test.each([3, 4, 5, 6, 100, 1000])(
    "creates an empty memory with period %i and maxDepth 10",
    (period) => {
      const memory = createDocumentMemory(period, 10);
      expect(memory).toEqual<DocumentMemory>({
        stack: {
          edits: [],
          bombBay: [],
          next: null,
        },
        serial: 0,
        period,
        maxDepth: 10,
        snapshots: [""],
        state: "",
      });
    },
  );
});
