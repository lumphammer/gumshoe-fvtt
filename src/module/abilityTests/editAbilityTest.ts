// Foundry glue for changes to ability test cards: answering a request for a
// Difficulty (by rolling it), withdrawing one, and correcting a Difficulty.
// Like attack edits, they run one at a time per card on the active GM's
// client, so a request can't be rolled twice, or rolled and cancelled.

import { createKeyedQueue } from "../../functions/createKeyedQueue";
import { assertGame } from "../../functions/isGame";
import { requestEditAbilityTest } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import { InvestigatorItem } from "../items/InvestigatorItem";
import type { AbilityTestEdit } from "./abilityTestEdits";
import { canMakeAbilityTestEdit } from "./abilityTestEdits";
import type { AbilityTestMessage } from "./AbilityTestMessageModel";
import { isAbilityTestMessage } from "./AbilityTestMessageModel";
import { refundSpends } from "./refundSpends";

/**
 * Without Dice So Nice, nothing makes a sound for a roll added to a message
 * which already exists. Dice So Nice (6.x) does animate added rolls, in the
 * dice it would use for any roll in that message, so it needs nothing from us.
 */
function playDiceSound() {
  if ("dice3d" in game && game.dice3d) return;
  void foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice }, true);
}

/** Give back the points a request took */
async function refundRequest(message: AbilityTestMessage) {
  const { abilityUuid, spend, bondSpends } = message.system;
  const ability = fromUuidSync(abilityUuid);
  if (!(ability instanceof InvestigatorItem)) return;
  // the card is its author's say-so: only give back points they could have
  // taken themselves
  const author = message.author;
  if (!author || !ability.testUserPermission(author, "OWNER")) return;
  await refundSpends({ ability, spend, bondSpends });
}

/**
 * Whether players see the number. The GM's own Difficulty is hidden if the
 * world says so; one a player picked stays visible until the GM changes it.
 */
function isDifficultyHidden(message: AbilityTestMessage, base: number | null) {
  return (
    message.system.difficulty.hidden ||
    (base !== null && settings.hideTestDifficulty.get())
  );
}

async function performAbilityTestEditNow(
  message: AbilityTestMessage,
  edit: AbilityTestEdit,
): Promise<void> {
  const { status } = message.system;
  switch (edit.kind) {
    case "roll": {
      if (status !== "requested") return;
      const { formula, params } = message.system;
      const roll = new Roll(formula, { ...params });
      await roll.evaluate();
      playDiceSound();
      await message.update({
        rolls: [JSON.stringify(roll)],
        ...(message.system.blindRoll ? { blind: true } : {}),
        system: {
          status: "rolled",
          difficulty: {
            base: edit.base,
            hidden: isDifficultyHidden(message, edit.base),
          },
        },
      });
      return;
    }
    case "cancel": {
      if (status !== "requested") return;
      // mark it first, so the points can't come back twice
      await message.update({ system: { status: "cancelled" } });
      await refundRequest(message);
      return;
    }
    case "setDifficulty": {
      if (status !== "rolled") return;
      await message.update({
        system: {
          difficulty: {
            base: edit.base,
            hidden: isDifficultyHidden(message, edit.base),
          },
        },
      });
      return;
    }
  }
}

const runExclusive = createKeyedQueue();

/**
 * Make a change to an ability test card, on this client. This should only be
 * called on the active GM's client (or, with no GM around, by whoever made the
 * test), so that changes to a card happen one at a time.
 */
export function performAbilityTestEdit(
  message: AbilityTestMessage,
  edit: AbilityTestEdit,
): Promise<void> {
  return runExclusive(message.id ?? "", () =>
    performAbilityTestEditNow(message, edit),
  );
}

/** Whether this user may make this change to this card */
export function canUserEditAbilityTest(
  user: User,
  message: AbilityTestMessage,
  edit: AbilityTestEdit,
): boolean {
  return canMakeAbilityTestEdit({
    edit,
    isGM: user.isGM,
    isRequester: message.author?.id === user.id,
  });
}

/**
 * Make a change to an ability test card: on this client if it's the active
 * GM's, otherwise by asking the GM's client to.
 */
export async function editAbilityTest(
  message: ChatMessage,
  edit: AbilityTestEdit,
): Promise<"done" | "requested" | "failed"> {
  assertGame(game);
  if (
    !isAbilityTestMessage(message) ||
    !canUserEditAbilityTest(game.user, message, edit)
  ) {
    return "failed";
  }
  if (game.user.isActiveGM) {
    await performAbilityTestEdit(message, edit);
    return "done";
  }
  if (game.users.activeGM) {
    requestEditAbilityTest({ messageId: message.id ?? "", edit });
    return "requested";
  }
  // with no GM, whoever made the test can still settle it
  if (!message.isOwner) return "failed";
  await performAbilityTestEdit(message, edit);
  return "done";
}
