// What an attack needs to know about a target's actor, from a plain view of
// it (a snapshot, or the live actor), so attack cards can work it out from
// snapshots. Keep documents out of this file.

import * as c from "../../constants";
import type { ItemView } from "../actors/pcDerived";
import { findHealthAbilityIn } from "../actors/pcDerived";
import type { TargetActorInfo } from "./resolveAttackTarget";

/** An actor, as a snapshot or the live actor (with its items as a list) */
export type TargetActorView = {
  readonly type: unknown;
  readonly system: unknown;
  readonly items: readonly ItemView[];
};

const healthResourceId = "health";

/**
 * A target's Hit Threshold, Armor and Health, and whether they're human or
 * immune to Lethality. Only PCs and NPCs have stats; Health comes from the
 * ability linked to it (or called "Health"), or else the Health resource.
 */
export function getTargetActorInfoIn(
  actor: TargetActorView | null,
): TargetActorInfo {
  if (actor === null) {
    return {
      hitThreshold: null,
      armor: null,
      health: null,
      isHuman: false,
      immuneToLethality: false,
    };
  }
  const isCharacter = actor.type === c.pc || actor.type === c.npc;
  const system = actor.system as {
    stats?: Record<string, unknown>;
    resources?: Record<string, { value?: number } | undefined>;
    isHuman?: boolean;
    immuneToLethality?: boolean;
  };
  const stat = (id: string) => {
    const value = isCharacter ? system.stats?.[id] : undefined;
    return typeof value === "number" ? value : null;
  };
  const healthAbility = findHealthAbilityIn(actor.items);
  const health = healthAbility
    ? (healthAbility.system as { pool: number }).pool
    : isCharacter
      ? (system.resources?.[healthResourceId]?.value ?? null)
      : null;
  return {
    hitThreshold: stat("hitThreshold"),
    armor: stat("armor"),
    health,
    isHuman: isCharacter && (system.isHuman ?? false),
    immuneToLethality: isCharacter && (system.immuneToLethality ?? false),
  };
}
