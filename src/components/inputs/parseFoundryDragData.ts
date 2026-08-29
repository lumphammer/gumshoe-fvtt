import type { JSONValue } from "fvtt-types/utils";

export function parseFoundryDragData(text: string): JSONValue | null {
  try {
    const data: unknown = JSON.parse(text);
    if (
      data === null ||
      Array.isArray(data) ||
      typeof data !== "object" ||
      !("type" in data) ||
      typeof data.type !== "string" ||
      data.type.length === 0
    ) {
      return null;
    }
    return data as JSONValue;
  } catch {
    return null;
  }
}
