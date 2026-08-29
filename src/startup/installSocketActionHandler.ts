import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { dispatchSystemSocketActionToHooks } from "../functions/systemSocketActions";
import { isSystemSocketAction } from "../typeAssertions";

/**
 * Installs a socket handler for the system's explicitly supported commands.
 * Foundry's custom socket relay appends the authenticated sender's user ID.
 */
export function installSocketActionHandler() {
  Hooks.on("ready", () => {
    assertGame(game);
    game.socket?.on(
      constants.socketScope,
      (data: unknown, requestingUserId: unknown) => {
        if (
          isSystemSocketAction(data) &&
          typeof requestingUserId === "string"
        ) {
          dispatchSystemSocketActionToHooks(data, requestingUserId);
        }
      },
    );
  });
}
