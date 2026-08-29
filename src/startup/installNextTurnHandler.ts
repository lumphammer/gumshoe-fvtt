import * as constants from "../constants";
import { canUserRequestCombatAction } from "../functions/canUserRequestCombatAction";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";

/**
 * Installs a foundry hook handler on the GM's client that listens for a request
 * to pass the turn from one of the players
 */
export function installNextTurnHandler() {
  Hooks.once("ready", () => {
    assertGame(game);
    Hooks.on(constants.nextTurn, (requestingUserId: string) => {
      if (!game.user.isActiveGM) {
        return;
      }
      systemLogger.log("nextTurn");
      assertGame(game);
      const combat = game.combat;
      const requestingUser = game.users.get(requestingUserId);
      if (
        !requestingUser ||
        !canUserRequestCombatAction(requestingUser, combat?.combatant)
      ) {
        return;
      }
      void combat?.nextTurn();
    });
  });
}
