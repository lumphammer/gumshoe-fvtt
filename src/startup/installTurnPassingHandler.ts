import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { InvestigatorCombat } from "../module/combat/InvestigatorCombat";
import { RequestTurnPassArgs } from "../types";

/**
 * Installs a foundry hook handler on the GM's client that listens for a request
 * to pass the turn from one of the players
 */
export function installTurnPassingHandler() {
  Hooks.once("ready", () => {
    assertGame(game);
    if (game.user.isGM) {
      Hooks.on(
        constants.requestTurnPass,
        ({ combatantId }: RequestTurnPassArgs) => {
          assertGame(game);
          const combat = game.combat as InvestigatorCombat;
          const combatant = combat?.combatants.get(combatantId);
          if (
            combat &&
            combatant &&
            combatant.passingTurnsRemaining > 0 &&
            combat.activeTurnPassingCombatant !== combatant._id
          ) {
            combat.activeTurnPassingCombatant = combatant._id;
            combatant.passingTurnsRemaining -= 1;
          }
        },
      );
    }
  });
}
