// Changes to an ability test's card. Pure: keep Foundry out of this file (the
// glue is `editAbilityTest.ts`).

/**
 * - roll: answer a request, with a Difficulty or without one (null)
 * - cancel: withdraw a request, giving the points back
 * - setDifficulty: change the Difficulty after the roll (or take it away)
 */
export type AbilityTestEdit =
  | { kind: "roll"; base: number | null }
  | { kind: "cancel" }
  | { kind: "setDifficulty"; base: number | null };

const isBase = (x: unknown): x is number | null =>
  x === null || (typeof x === "number" && Number.isInteger(x));

export function isAbilityTestEdit(x: unknown): x is AbilityTestEdit {
  if (x === null || typeof x !== "object" || Array.isArray(x)) return false;
  const record = x as Record<string, unknown>;
  switch (record["kind"]) {
    case "roll":
    case "setDifficulty":
      return Object.keys(record).length === 2 && isBase(record["base"]);
    case "cancel":
      return Object.keys(record).length === 1;
    default:
      return false;
  }
}

/**
 * Whether someone may make this change. Setting the Difficulty is the GM's
 * job; whoever asked for the test can withdraw it, or roll it without a
 * Difficulty.
 */
export function canMakeAbilityTestEdit({
  edit,
  isGM,
  isRequester,
}: {
  edit: AbilityTestEdit;
  isGM: boolean;
  isRequester: boolean;
}): boolean {
  if (isGM) return true;
  if (!isRequester) return false;
  return edit.kind === "cancel" || (edit.kind === "roll" && edit.base === null);
}
