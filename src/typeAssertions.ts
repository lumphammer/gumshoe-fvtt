import { hasOwnProperty } from "./functions/utilities";
import { EquipmentFieldType, SocketHookAction } from "./types";

export function isSocketHookAction(
  x: unknown,
): x is SocketHookAction<Hooks.HookName> {
  return (
    hasOwnProperty(x, "hook") &&
    typeof x["hook"] === "string" &&
    hasOwnProperty(x, "payload") &&
    Array.isArray(x["payload"])
  );
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
