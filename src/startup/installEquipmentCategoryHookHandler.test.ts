import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isEquipmentItem: vi.fn(() => true),
  getCategories: vi.fn(),
}));

vi.mock("../functions/isGame", () => ({ assertGame: vi.fn() }));
vi.mock("../module/items/equipment", () => ({
  isEquipmentItem: mocks.isEquipmentItem,
}));
vi.mock("../settings/settings", () => ({
  settings: { equipmentCategories: { get: mocks.getCategories } },
}));

import { installEquipmentCategoryHookHandler } from "./installEquipmentCategoryHookHandler";

const categories = {
  general: {
    name: "General",
    fields: { quantity: { name: "Quantity", type: "number", default: 1 } },
  },
  weapons: { name: "Weapons", fields: {} },
};

function setUp(categoryId: string) {
  let handler: any;
  vi.stubGlobal("Hooks", {
    on: (event: string, fn: unknown) => {
      if (event === "preCreateItem") handler = fn;
    },
  });
  vi.stubGlobal("game", { userId: "user1" });
  mocks.getCategories.mockReturnValue(categories);
  installEquipmentCategoryHookHandler();
  const item = {
    system: { categoryId, fields: {} },
    updateSource: vi.fn(),
  };
  return { handler, item };
}

describe("installEquipmentCategoryHookHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isEquipmentItem.mockReturnValue(true);
  });

  it("fills in the defaults for the item's category", () => {
    const { handler, item } = setUp("general");

    handler(item, {}, {}, "user1");

    expect(item.updateSource).toHaveBeenCalledWith({
      system: { categoryId: "general", fields: { quantity: 1 } },
    });
  });

  it("falls back to the first category when the item has none", () => {
    const { handler, item } = setUp("");

    handler(item, {}, {}, "user1");

    expect(item.updateSource).toHaveBeenCalledWith({
      system: { categoryId: "general", fields: { quantity: 1 } },
    });
  });

  it("keeps an unresolvable category id instead of throwing or reassigning", () => {
    const { handler, item } = setUp("fromAnotherWorld");

    expect(() => handler(item, {}, {}, "user1")).not.toThrow();

    expect(item.updateSource).toHaveBeenCalledWith({
      system: { categoryId: "fromAnotherWorld", fields: {} },
    });
  });
});
