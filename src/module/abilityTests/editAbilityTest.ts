// Foundry glue for changes to ability test cards: answering a request for a
// Difficulty (by rolling it), withdrawing one, and correcting a Difficulty.
// Like attack edits, they run one at a time per card on the active GM's
// client, so a request can't be rolled twice, or rolled and cancelled.

import { createKeyedQueue } from "../../functions/createKeyedQueue";
import { assertGame } from "../../functions/isGame";
import { requestEditAbilityTest } from "../../functions/utilities";
import { clampBondPoints } from "../bonds/rules";
import { isBondItem } from "../items/bond";
import { InvestigatorItem } from "../items/InvestigatorItem";
import type { AbilityTestEdit } from "./abilityTestEdits";
import { canMakeAbilityTestEdit } from "./abilityTestEdits";
import type { AbilityTestMessage } from "./AbilityTestMessageModel";
import { isAbilityTestMessage } from "./AbilityTestMessageModel";

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
  const pool = (ability.system as { pool?: number }).pool;
  if (spend > 0 && typeof pool === "number") {
    await ability.update({ system: { pool: pool + spend } });
  }
  const actor = ability.parent;
  if (!actor) return;
  const bondUpdates = bondSpends.flatMap(({ id, spend }) => {
    const bond = actor.items.get(id);
    return isBondItem(bond) && spend > 0
      ? [
          {
            _id: id,
            system: { points: clampBondPoints(bond.system.points + spend) },
          },
        ]
      : [];
  });
  if (bondUpdates.length > 0) {
    await actor.updateEmbeddedDocuments("Item", bondUpdates);
  }
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
        system: { status: "rolled", difficulty: { base: edit.base } },
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
      await message.update({ system: { difficulty: { base: edit.base } } });
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
