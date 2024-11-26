import * as constants from "../constants";
import { assertGame } from "../functions/utilities";
import { RequestTurnPassArgs } from "../types";
// import { assertActiveCharacterActor } from "../v10Types";

/**
 * Installs a foundry hook handler on the GM's client that listens for a request
 * to pass the turn from one of the players
 */
export function installTurnPassingHandler() {
  Hooks.once("ready", () => {
    assertGame(game);
    if (game.user?.isGM) {
      Hooks.on(
        constants.requestTurnPass,
        ({ combatantId }: RequestTurnPassArgs) => {
          assertGame(game);
          const combat = game.combat;
          const combatant = combat?.combatants.get(combatantId);
          const actor = combatant?.actor;
          if (
            actor &&
            combat &&
            combatant &&
            combatant.passingTurnsRemaining > 0 &&
            combat.activeTurnPassingCombatant !== combatant._id
          ) {
            // assertActiveCharacterActor(actor);
            combat.activeTurnPassingCombatant = combatant._id;
            combatant.passingTurnsRemaining -= 1;
          }
        },
      );
    }
  });
}
