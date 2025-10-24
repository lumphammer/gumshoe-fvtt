import { expect, test, vi } from "vitest";

import { createDocumentMemory } from "./createDocumentMemory";
import { restoreVersion } from "./restoreVersion";
import { save } from "./save";
import { advanceTime10s } from "./testHelpers";

// these are the serial numbers which should be restorable. annotated with the
// gap between them to show your fading stack memory
const validVersions: number[] = [
  // going up in 243's (oldest)
  243, 486,
  // 81's
  648, 729, 810,
  // 27's
  891, 918, 945,
  // 9's
  963, 972, 981,
  // 3's
  990, 993, 996,
  // going up in 1's (most recent)
  998, 999, 1000,
];

// I'm not typing this bad boy out, sorry
const invalidVersions = Array.from({ length: 1002 }, (_, i) => i).filter(
  (i) => !validVersions.includes(i),
);

// fill the memory
vi.setSystemTime(new Date(0));
let memory = createDocumentMemory(3);

for (let i = 1; i <= 1000; i++) {
  memory = save(memory, `${i}`);
  advanceTime10s();
}

// a couple of manual tests
test("restoring a valid version 1000", () => {
  expect(restoreVersion(memory, 1000)).toBe("1000");
});

test("restoring a valid version 648", () => {
  expect(restoreVersion(memory, 648)).toBe("648");
});

test("restoring an invalid version throws", () => {
  expect.assertions(invalidVersions.length);
  for (const serial of invalidVersions) {
    expect(() => restoreVersion(memory, serial)).toThrowError(
      /Could not find stack with serial \d+/,
    );
  }
});

test.each(validVersions)("restore version %i", (serial) => {
  const restored = restoreVersion(memory, serial);
  expect(restored).toBe(`${serial}`);
});
