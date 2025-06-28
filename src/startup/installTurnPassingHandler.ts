import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { RequestTurnPassArgs } from "../types";

type CombatUpdateData = foundry.documents.Combat.UpdateData;

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
          systemLogger.log("requestTurnPass", combatantId);
          assertGame(game);
          const combat = game.combat;
          const combatant = game.combat?.combatants.get(combatantId);
          if (!combatant || !combat) {
            return;
          }
          const updateData: CombatUpdateData = {};
          if (combat.round === 0) {
            updateData.round = 1;
          }
          const turnIndex = combat.turns.findIndex((c) => c.id === combatantId);
          if (combatant.passingTurnsRemaining > 0) {
            combatant.passingTurnsRemaining -= 1;
          }
          if (turnIndex !== undefined && turnIndex >= 0) {
            updateData.turn = turnIndex;
          }
          void combat.update(updateData);
        },
      );
    }
  });
}
