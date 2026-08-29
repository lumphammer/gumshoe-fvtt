import { expect, it } from "vitest";

import { parseFoundryDragData } from "./parseFoundryDragData";

it.each(["ordinary text", "{broken", "null", '"text"', "[]", "{}"])(
  "leaves non-Foundry drop data alone: %s",
  (text) => {
    expect(parseFoundryDragData(text)).toBeNull();
  },
);

it("accepts a current world-document drag payload", () => {
  const data = { type: "Actor", uuid: "Actor.abc123" };

  expect(parseFoundryDragData(JSON.stringify(data))).toEqual(data);
});

it("accepts a current compendium-document drag payload", () => {
  const data = {
    type: "Item",
    uuid: "Compendium.investigator.items.Item.abc123",
  };

  expect(parseFoundryDragData(JSON.stringify(data))).toEqual(data);
});

it("accepts a legacy document drag payload", () => {
  const data = { type: "Item", id: "abc123", pack: "investigator.items" };

  expect(parseFoundryDragData(JSON.stringify(data))).toEqual(data);
});
