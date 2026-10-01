import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import {
  applyAttackDamageLocally,
  canUserActOnAttack,
} from "../module/attacks/applyAttackDamage";
import type { ApplyAttackDamageArgs } from "../types";

/**
 * Installs a foundry hook handler on the GM's client that applies attack damage
 * on behalf of players who don't own the target.
 */
export function installApplyAttackDamageHandler() {
  Hooks.once("ready", () => {
    Hooks.on(
      constants.applyAttackDamage,
      (
        { messageId, targetId, undo }: ApplyAttackDamageArgs,
        requestingUserId: string,
      ) => {
        assertGame(game);
        if (!game.user.isActiveGM) {
          return;
        }
        const message = game.messages.get(messageId);
        const requestingUser = game.users.get(requestingUserId);
        if (
          !message ||
          !requestingUser ||
          !canUserActOnAttack(requestingUser, message)
        ) {
          return;
        }
        systemLogger.log("applyAttackDamage", messageId, targetId, undo);
        void applyAttackDamageLocally(message, targetId, undo);
      },
    );
  });
}
