function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function getId(value: unknown): string | undefined {
  return isPlainObject(value) && typeof value["_id"] === "string"
    ? value["_id"]
    : undefined;
}

/**
 * Return `next`, but with every subtree that deep-equals the corresponding
 * subtree of `prev` replaced by `prev`'s. If nothing changed, returns `prev`
 * itself.
 *
 * Plain objects and arrays are compared structurally, everything else with
 * `Object.is`. Array elements with an `_id` (embedded documents) are matched
 * to `prev`'s by `_id` rather than by index, so deleting an item from the
 * middle of a list doesn't change the identity of every item after it.
 */
export function replaceEqualDeep<T>(prev: unknown, next: T): T {
  if (Object.is(prev, next)) return next;

  if (Array.isArray(prev) && Array.isArray(next)) {
    let prevById: Map<string | undefined, unknown> | undefined;
    let same = prev.length === next.length;
    const result = next.map((nextValue: unknown, i) => {
      const id = getId(nextValue);
      let prevValue: unknown = prev[i];
      if (id !== undefined && getId(prevValue) !== id) {
        prevById ??= new Map(prev.map((p: unknown) => [getId(p), p]));
        prevValue = prevById.get(id);
      }
      const value = replaceEqualDeep(prevValue, nextValue);
      if (!Object.is(value, prev[i])) same = false;
      return value;
    });
    return (same ? prev : result) as T;
  }

  if (isPlainObject(prev) && isPlainObject(next)) {
    const nextKeys = Object.keys(next);
    let same = Object.keys(prev).length === nextKeys.length;
    const result: Record<string, unknown> = {};
    for (const key of nextKeys) {
      const value = replaceEqualDeep(prev[key], next[key]);
      result[key] = value;
      if (!Object.is(value, prev[key]) || !Object.hasOwn(prev, key)) {
        same = false;
      }
    }
    return (same ? prev : result) as T;
  }

  return next;
}
