import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";

/**
 * Installs a foundry hook handler on the GM's client that listens for a request
 * to pass the turn from one of the players
 */
export function installNextTurnHandler() {
  Hooks.once("ready", () => {
    assertGame(game);
    Hooks.on(constants.nextTurn, () => {
      if (!game.user.isActiveGM) {
        return;
      }
      systemLogger.log("nextTurn");
      assertGame(game);
      const combat = game.combat;
      combat?.nextTurn();
    });
  });
}
