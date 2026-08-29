import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  equipmentCategories: { get: vi.fn() },
  migrateValue: vi.fn(),
}));

vi.mock("../../functions/maybeNotesObjectToString", () => ({
  maybeNotesObjectToString: vi.fn(),
}));
vi.mock("../../functions/migrateValue", () => ({
  migrateValue: mocks.migrateValue,
}));
vi.mock("../../fvtt-exports", () => {
  class MockField {}
  class MockTypeDataModel {
    static migrateData(source: object) {
      return source;
    }
  }
  return {
    StringField: MockField,
    TypeDataModel: MockTypeDataModel,
  };
});
vi.mock("../../settings/settings", () => ({
  settings: { equipmentCategories: mocks.equipmentCategories },
}));
vi.mock("../schemaFields", () => ({ createRecordField: vi.fn(() => ({})) }));
vi.mock("./InvestigatorItem", () => ({ InvestigatorItem: class {} }));

import { EquipmentModel } from "./equipment";

describe("EquipmentModel.migrateData", () => {
  beforeEach(() => {
    mocks.equipmentCategories.get.mockReset();
    mocks.equipmentCategories.get.mockReturnValue({ custom: {} });
    mocks.migrateValue.mockReset();
  });

  it("renames a legacy category before schema cleaning", () => {
    const source: Record<string, unknown> = { category: "weapons" };

    expect(EquipmentModel.migrateData(source)).toBe(source);
    expect(source).toEqual({ categoryId: "weapons" });

    EquipmentModel.migrateData(source);
    expect(source).toEqual({ categoryId: "weapons" });
    expect(mocks.equipmentCategories.get).not.toHaveBeenCalled();
  });

  it("preserves an existing categoryId and removes the legacy field", () => {
    const source: Record<string, unknown> = {
      category: "old",
      categoryId: "current",
    };

    EquipmentModel.migrateData(source);

    expect(source).toEqual({ categoryId: "current" });
    expect(mocks.equipmentCategories.get).not.toHaveBeenCalled();
  });

  it("uses the first configured category when neither field has a value", () => {
    const source: Record<string, unknown> = {};

    EquipmentModel.migrateData(source);

    expect(source).toEqual({ categoryId: "custom" });
    expect(mocks.equipmentCategories.get).toHaveBeenCalledOnce();
  });
});
