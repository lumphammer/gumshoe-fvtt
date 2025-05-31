import { isActiveCharacterActor } from "../../module/actors/exports";
import { TurnInfo } from "./types";

const getValue = <T>(resource: T): T | number => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "value" in resource &&
    typeof resource.value === "number"
  ) {
    return resource.value;
  }
  return resource;
};

// adapted from foundry's CombatTracker, so there's some mutable data and
// weird imperative stuff
export function getTurns(combat: Combat): TurnInfo[] {
  const turns: TurnInfo[] = [];
  let hasDecimals = false;

  for (const [i, combatant] of combat.turns.entries()) {
    if (!combatant.visible || combatant.id === null) {
      continue;
    }

    // Prepare turn data
    const resource =
      combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
        ? getValue(combatant.resource)
        : null;

    const active = i === combat.turn;
    const hidden = combatant.hidden;
    let defeated = combatant.defeated;
    const owner = combatant.isOwner;
    const initiative = combatant.initiative;
    const hasRolled = combatant.initiative !== null;
    const hasResource = resource !== null;
    hasDecimals ||= initiative !== null && !Number.isInteger(initiative);

    // foundry's normal tracker does some stuff with game.video to get
    // thumbnails of video tokens but it makes this code go async which is
    // going to be a pain, and tbh I'm not convinced it's a huge use-case
    const img = combatant.img;

    const totalPassingTurns = isActiveCharacterActor(combatant.actor)
      ? (combatant.actor?.system.initiativePassingTurns ?? 1)
      : 1;

    const effects = [];
    for (const effect of combatant.actor?.temporaryEffects ?? []) {
      if (effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED)) {
        defeated = true;
      } else if (effect.img) {
        effects.push({ img: effect.img, name: effect.name });
      }
    }

    type _T = typeof combatant.name;

    const turn: TurnInfo = {
      id: combatant.id,
      name: combatant.name ?? "",
      img: img ?? CONST.DEFAULT_TOKEN,
      active,
      owner,
      defeated,
      hidden,
      initiative,
      hasRolled,
      hasResource,
      resource,
      effects,
      passingTurnsRemaining: combatant.passingTurnsRemaining,
      totalPassingTurns,
    };

    turns.push(turn);
  }

  return turns;
}
