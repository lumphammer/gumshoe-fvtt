import { isActiveCharacterActor } from "../../module/actors/exports";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { TurnInfo } from "./types";

// adapted from foundry's CombatTracker, so there's some mutable data and
// weird imperative stuff
export function getTurns(combat: Combat): TurnInfo[] {
  const turns: TurnInfo[] = [];
  let hasDecimals = false;

  for (const combatant of Array.from(combat.turns)) {
    if (!combatant.visible || combatant.id === null) {
      continue;
    }

    hasDecimals ||=
      combatant.initiative !== null && !Number.isInteger(combatant.initiative);

    const turn: TurnInfo = {
      id: combatant.id,
      name: combatant.name ?? "",
      img: combatant.effectiveImg,
      active: combatant.active,
      defeated:
        (combatant.defeated ||
          combatant.actor?.temporaryEffects.some((e) =>
            e.statuses.has(CONFIG.specialStatusEffects.DEFEATED),
          )) ??
        false,
      hidden: combatant.hidden,
      initiative: combatant.initiative,
      resource: combatant.effectiveResource,
      effects:
        combatant.actor?.temporaryEffects.filter(
          (e) => !e.statuses.has(CONFIG.specialStatusEffects.DEFEATED),
        ) ?? [],
      passingTurnsRemaining: isTurnPassingCombatant(combatant)
        ? combatant.system.passingTurnsRemaining
        : 0,
      totalPassingTurns: isActiveCharacterActor(combatant.actor)
        ? (combatant.actor?.system.initiativePassingTurns ?? 1)
        : 1,
    };

    turns.push(turn);
  }

  return turns;
}
