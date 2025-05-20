import { assertGame } from "../../functions/utilities";
import { isActiveCharacterActor } from "../../v10Types";
import { TurnInfo } from "./types";

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
        ? combatant.resource
        : null;

    const active = i === combat.turn;
    const hidden = combatant.hidden;
    let defeated = combatant.defeated;
    const owner = combatant.isOwner;
    const initiative = combatant.initiative;
    const hasRolled = combatant.initiative !== null;
    const hasResource = resource !== null;
    hasDecimals ||= initiative !== null && !Number.isInteger(initiative);

    let img = combatant.img as string;
    // Cached thumbnail image for video tokens
    if (VideoHelper.hasVideoExtension(img)) {
      assertGame(game);
      // @ts-expect-error combatant._thumb is a thing
      if (combatant._thumb) {
        // @ts-expect-error combatant._thumb is a thing
        img = combatant._thumb;
      } else {
        void game.video
          .createThumbnail(img, { width: 100, height: 100 })
          .then((img: string) => {
            // @ts-expect-error combatant._thumb is a thing
            img = combatant._thumb = img;
          });
      }
    }

    // // Actor and Token status effects
    // const effects = new Set<string>();
    // if (combatant.token) {
    //   // @ts-expect-error v10 types
    //   combatant.token.effects.forEach((e) => effects.add(e));
    //   if (combatant.token.overlayEffect) {
    //     effects.add(combatant.token.overlayEffect);
    //   }
    // }
    // if (combatant.actor) {
    //   combatant.actor.temporaryEffects.forEach((e) => {
    //     let hasDefeatedStatus = false;
    //     const statuses = e.statuses;

    //     if (statuses.has(CONFIG.specialStatusEffects.DEFEATED)) {
    //       hasDefeatedStatus = true;
    //     }

    //     if (hasDefeatedStatus) {
    //       defeated = true;
    //     } else if (e.icon) {
    //       effects.add(e.icon);
    //     }
    //   });
    // }

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

    const turn = {
      id: combatant.id,
      name: combatant.name ?? "",
      img,
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
  // const precision = CONFIG.Combat.initiative.decimals;
  // turns.forEach((t) => {
  //   if (t.initiative !== null) {
  //     t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
  //   }
  // });

  return turns;
}
