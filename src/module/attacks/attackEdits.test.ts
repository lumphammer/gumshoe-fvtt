import { expect, it } from "vitest";

import { isAttackEdit } from "./attackEdits";

const payment = {
  weaponSpend: 1,
  other: { name: "Athletics", spend: 2 },
  affordable: true,
};

it.each([
  { kind: "updateTarget", targetId: "t", update: { cover: "full" } },
  {
    kind: "updateTarget",
    targetId: "t",
    update: { armorOverride: null, shotDryBonus: true },
  },
  { kind: "updateTarget", targetId: "t", update: { armorOverride: 2 } },
  { kind: "removeTarget", targetId: "t" },
  { kind: "rollDamage", targetId: "t" },
  { kind: "addTargets", tokenUuids: ["Scene.s.Token.a", "Scene.s.Token.b"] },
  { kind: "setTarget", tokenUuid: "Scene.s.Token.a" },
  { kind: "walkFire", tokenUuid: "Scene.s.Token.a", payment },
  {
    kind: "walkFire",
    tokenUuid: "Scene.s.Token.a",
    payment: { weaponSpend: 2, other: null, affordable: true },
  },
  { kind: "applyDamage", targetId: "t", undo: false },
])("accepts the attack edit %j", (edit) => {
  expect(isAttackEdit(edit)).toBe(true);
});

it.each([
  null,
  "removeTarget",
  [],
  {},
  { kind: "deleteMessage" },
  { kind: "removeTarget" },
  { kind: "removeTarget", targetId: "" },
  { kind: "removeTarget", targetId: "t", extra: 1 },
  { kind: "updateTarget", targetId: "t", update: {} },
  { kind: "updateTarget", targetId: "t", update: { cover: "behind a wall" } },
  { kind: "updateTarget", targetId: "t", update: { applied: null } },
  { kind: "updateTarget", targetId: "t", update: { armorOverride: "2" } },
  { kind: "updateTarget", targetId: "t", update: { armorOverride: NaN } },
  { kind: "addTargets", tokenUuids: [] },
  { kind: "addTargets", tokenUuids: ["a", 7] },
  { kind: "setTarget", tokenUuid: 7 },
  {
    kind: "walkFire",
    tokenUuid: "a",
    payment: { ...payment, weaponSpend: -1 },
  },
  {
    kind: "walkFire",
    tokenUuid: "a",
    payment: { ...payment, other: { name: "", spend: 1 } },
  },
  { kind: "walkFire", tokenUuid: "a", payment: { ...payment, extra: 1 } },
  { kind: "applyDamage", targetId: "t", undo: "yes" },
])("rejects the invalid attack edit %j", (edit) => {
  expect(isAttackEdit(edit)).toBe(false);
});
