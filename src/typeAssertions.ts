import { hasOwnProperty } from "./functions/utilities";
import { EquipmentFieldType, SystemSocketAction } from "./types";

export function isSystemSocketAction(x: unknown): x is SystemSocketAction {
  if (x === null || Array.isArray(x) || typeof x !== "object") return false;
  if (!hasOwnProperty(x, "type") || typeof x["type"] !== "string") return false;

  if (x["type"] === "requestNextTurn") {
    return Object.keys(x).length === 1;
  }
  if (x["type"] === "requestTurnPass") {
    return (
      Object.keys(x).length === 2 &&
      hasOwnProperty(x, "combatantId") &&
      typeof x["combatantId"] === "string" &&
      x["combatantId"].length > 0
    );
  }
  return false;
}

export function isEquipmentFieldType(type: string): type is EquipmentFieldType {
  return type === "string" || type === "number" || type === "checkbox";
}

export function assertIsEquipmentFieldType(
  type: string,
): asserts type is EquipmentFieldType {
  if (!isEquipmentFieldType(type)) {
    throw new Error(`Invalid equipment field type: ${type}`);
  }
}
