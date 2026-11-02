import { describe, expect, it } from "vitest";

import { liveItem, liveItems } from "./liveItems";

type Fake = { id: string; type: string };
const isWeapon = (x: unknown): x is Fake =>
  (x as Fake | undefined)?.type === "weapon";

const docs = new Map<string, Fake>([
  ["a", { id: "a", type: "weapon" }],
  ["b", { id: "b", type: "bond" }],
  ["c", { id: "c", type: "weapon" }],
]);
const actor = {
  items: { get: (id: string) => docs.get(id) },
} as unknown as Actor;

describe("liveItems", () => {
  it("looks items up by id, in order, skipping missing and other types", () => {
    expect(
      liveItems(actor, ["c", "gone", "b", "a"], isWeapon).map(({ id }) => id),
    ).toEqual(["c", "a"]);
    expect(liveItems(null, ["a"], isWeapon)).toEqual([]);
  });

  it("looks one up", () => {
    expect(liveItem(actor, "a", isWeapon)?.id).toBe("a");
    expect(liveItem(actor, "b", isWeapon)).toBeUndefined();
  });
});
