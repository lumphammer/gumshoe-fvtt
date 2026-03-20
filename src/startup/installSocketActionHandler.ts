import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { isSocketHookAction } from "../typeAssertions";

/**
 * Installs a socket handler that listens for socket messages and calls the
 * appropriate hook.
 */
export function installSocketActionHandler() {
  Hooks.on("ready", () => {
    assertGame(game);
    game.socket?.on(constants.socketScope, (data: unknown) => {
      if (isSocketHookAction(data)) {
        Hooks.call(data.hook, ...data.payload);
      }
    });
  });
}
