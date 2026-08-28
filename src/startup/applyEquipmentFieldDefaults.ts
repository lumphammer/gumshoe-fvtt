import type { EquipmentCategory } from "@lumphammer/investigator-fvtt-types";

import type { EquipmentSystemData } from "../module/items/equipment";

export function applyEquipmentFieldDefaults(
  currentFields: EquipmentSystemData["fields"],
  fieldDefinitions: EquipmentCategory["fields"],
): EquipmentSystemData["fields"] {
  const fields = { ...currentFields };
  for (const [fieldId, definition] of Object.entries(fieldDefinitions)) {
    fields[fieldId] ??= definition.default;
  }
  return fields;
}
