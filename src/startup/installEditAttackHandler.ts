import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { canUserActOnAttack } from "../module/attacks/applyAttackDamage";
import { isAttackMessage } from "../module/attacks/attackTargets";
import { performAttackEdit } from "../module/attacks/editAttack";
import type { EditAttackArgs } from "../types";

/**
 * Installs a foundry hook handler on the GM's client that makes changes to
 * attack cards for everyone else, so they all happen in one place, one at a
 * time (see `editAttack`).
 */
export function installEditAttackHandler() {
  Hooks.once("ready", () => {
    Hooks.on(
      constants.editAttack,
      ({ messageId, edit }: EditAttackArgs, requestingUserId: string) => {
        assertGame(game);
        // the GM's own changes don't come this way
        if (!game.user.isActiveGM || requestingUserId === game.userId) {
          return;
        }
        const message = game.messages.get(messageId);
        const requestingUser = game.users.get(requestingUserId);
        if (
          !message ||
          !isAttackMessage(message) ||
          !requestingUser ||
          !canUserActOnAttack(requestingUser, message)
        ) {
          return;
        }
        systemLogger.log("editAttack", messageId, edit);
        void performAttackEdit(message, edit, requestingUserId);
      },
    );
  });
}
