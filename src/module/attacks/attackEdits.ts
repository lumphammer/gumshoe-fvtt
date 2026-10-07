import type { Cover, WalkingFirePayment } from "./rules";
import { coverValues } from "./rules";

/** The parts of a target which can be changed directly on the card */
export type TargetUpdate = {
  cover?: Cover;
  armorOverride?: number | null;
  shotDryBonus?: boolean;
};

/**
 * A change to an attack card. These all run on the active GM's client, one
 * at a time per card, so two people changing one card at once can't
 * overwrite each other's changes. Anything which depends on who's asking
 * (like which tokens they've targeted) is worked out before it's sent.
 */
export type AttackEdit =
  | { kind: "updateTarget"; targetId: string; update: TargetUpdate }
  | { kind: "removeTarget"; targetId: string }
  | { kind: "addTargets"; tokenUuids: string[] }
  | { kind: "setTarget"; tokenUuid: string }
  | { kind: "rollDamage"; targetId: string }
  | { kind: "walkFire"; tokenUuid: string; payment: WalkingFirePayment }
  | { kind: "applyDamage"; targetId: string; undo: boolean };

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function hasExactKeys(x: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(x);
  return (
    actual.length === keys.length && keys.every((key) => actual.includes(key))
  );
}

function isId(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function isTargetUpdate(x: unknown): x is TargetUpdate {
  if (!isRecord(x)) return false;
  const keys = Object.keys(x);
  if (keys.length === 0) return false;
  return keys.every((key) => {
    const value = x[key];
    switch (key) {
      case "cover":
        return (
          typeof value === "string" &&
          (coverValues as readonly string[]).includes(value)
        );
      case "armorOverride":
        return (
          value === null ||
          (typeof value === "number" && Number.isFinite(value))
        );
      case "shotDryBonus":
        return typeof value === "boolean";
      default:
        return false;
    }
  });
}

function isWalkingFirePayment(x: unknown): x is WalkingFirePayment {
  if (
    !isRecord(x) ||
    !hasExactKeys(x, ["weaponSpend", "other", "affordable"])
  ) {
    return false;
  }
  const { weaponSpend, other, affordable } = x;
  if (
    typeof weaponSpend !== "number" ||
    !Number.isInteger(weaponSpend) ||
    weaponSpend < 0 ||
    typeof affordable !== "boolean"
  ) {
    return false;
  }
  if (other === null) return true;
  return (
    isRecord(other) &&
    hasExactKeys(other, ["name", "spend"]) &&
    isId(other["name"]) &&
    typeof other["spend"] === "number" &&
    Number.isInteger(other["spend"]) &&
    other["spend"] >= 0
  );
}

/**
 * Check that something (e.g. from another client) is a valid `AttackEdit`,
 * with nothing extra.
 */
export function isAttackEdit(x: unknown): x is AttackEdit {
  if (!isRecord(x)) return false;
  switch (x["kind"]) {
    case "updateTarget":
      return (
        hasExactKeys(x, ["kind", "targetId", "update"]) &&
        isId(x["targetId"]) &&
        isTargetUpdate(x["update"])
      );
    case "removeTarget":
    case "rollDamage":
      return hasExactKeys(x, ["kind", "targetId"]) && isId(x["targetId"]);
    case "addTargets":
      return (
        hasExactKeys(x, ["kind", "tokenUuids"]) &&
        Array.isArray(x["tokenUuids"]) &&
        x["tokenUuids"].length > 0 &&
        x["tokenUuids"].every(isId)
      );
    case "setTarget":
      return hasExactKeys(x, ["kind", "tokenUuid"]) && isId(x["tokenUuid"]);
    case "walkFire":
      return (
        hasExactKeys(x, ["kind", "tokenUuid", "payment"]) &&
        isId(x["tokenUuid"]) &&
        isWalkingFirePayment(x["payment"])
      );
    case "applyDamage":
      return (
        hasExactKeys(x, ["kind", "targetId", "undo"]) &&
        isId(x["targetId"]) &&
        typeof x["undo"] === "boolean"
      );
    default:
      return false;
  }
}
