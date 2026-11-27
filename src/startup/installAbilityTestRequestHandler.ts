import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { isAbilityTestMessage } from "../module/abilityTests/AbilityTestMessageModel";
import {
  askForDifficulty,
  closeDifficultyPrompt,
} from "../module/abilityTests/askForDifficulty";
import {
  canUserEditAbilityTest,
  performAbilityTestEdit,
  recoverInterruptedRolls,
} from "../module/abilityTests/editAbilityTest";
import type { EditAbilityTestArgs } from "../types";

/**
 * On the active GM's client: prompt for a Difficulty when a player asks for a
 * test, and make changes to ability test cards for everyone else (see
 * `editAbilityTest`).
 */
export function installAbilityTestRequestHandler() {
  Hooks.once("ready", () => {
    // a test whose roll was interrupted goes back to waiting, and the GM is
    // asked again: when a page loads (so a player who reloads mid-roll, with
    // no GM around, gets theirs back), or when another user (perhaps the one
    // who was rolling it) leaves
    const recover = async () => {
      const recovered = await recoverInterruptedRolls();
      if (!game.user?.isActiveGM) return;
      for (const message of recovered) {
        askForDifficulty(message);
      }
    };
    void recover();
    Hooks.on("userConnected", (_user: User, connected: boolean) => {
      if (!connected) void recover();
    });

    Hooks.on("createChatMessage", (message: ChatMessage) => {
      assertGame(game);
      if (
        game.user.isActiveGM &&
        isAbilityTestMessage(message) &&
        message.system.status === "requested"
      ) {
        askForDifficulty(message);
      }
    });

    // a request answered from its card, or withdrawn, needs no prompt
    Hooks.on("updateChatMessage", (message: ChatMessage) => {
      if (
        isAbilityTestMessage(message) &&
        message.system.status !== "requested"
      ) {
        closeDifficultyPrompt(message.id ?? "");
      }
    });
    Hooks.on("deleteChatMessage", (message: ChatMessage) => {
      closeDifficultyPrompt(message.id ?? "");
    });

    Hooks.on(
      constants.editAbilityTest,
      ({ messageId, edit }: EditAbilityTestArgs, requestingUserId: string) => {
        assertGame(game);
        // the GM's own changes don't come this way
        if (!game.user.isActiveGM || requestingUserId === game.userId) {
          return;
        }
        const message = game.messages.get(messageId);
        const requestingUser = game.users.get(requestingUserId);
        if (
          !message ||
          !isAbilityTestMessage(message) ||
          !requestingUser ||
          !canUserEditAbilityTest(requestingUser, message, edit)
        ) {
          return;
        }
        systemLogger.log("editAbilityTest", messageId, edit);
        void performAbilityTestEdit(message, edit);
      },
    );
  });
}
