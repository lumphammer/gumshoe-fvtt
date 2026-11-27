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

/** our rolls carry data, which plain `Roll` doesn't allow for */
type TestRoll = Roll<Record<string, number>>;

type DiceSoNice = {
  showForRoll(
    roll: TestRoll,
    user?: User,
    synchronize?: boolean,
    users?: string[] | null,
    blind?: boolean,
    messageId?: string | null,
    speaker?: unknown,
  ): Promise<boolean>;
};

function getDiceSoNice(): DiceSoNice | undefined {
  return (game as { dice3d?: DiceSoNice }).dice3d;
}

/**
 * Show the dice before the roll goes on the card. Left to itself, Dice So
 * Nice would animate the roll once it's on the card, hiding the whole card
 * (one `.dice-roll`) until it's done; this way the request stays on show.
 * The dice are whoever made the test's.
 */
async function showDice(message: AbilityTestMessage, roll: TestRoll) {
  const dice3d = getDiceSoNice();
  if (!dice3d) {
    void foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice }, true);
    return;
  }
  await dice3d.showForRoll(
    roll,
    message.author ?? undefined,
    true,
    message.whisper.length > 0
      ? message.whisper.flatMap((user) => (user ? [String(user)] : []))
      : null,
    message.blind || message.system.blindRoll,
    message.id,
    message.speaker,
  );
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
      // the card shows the request, with nothing to click, while the dice roll
      await message.update({ system: { status: "rolling" } });
      try {
        const { formula, params } = message.system;
        const roll: TestRoll = new Roll(formula, { ...params });
        await roll.evaluate();
        await showDice(message, roll);
        await message.update({
          rolls: [JSON.stringify(roll)],
          ...(message.system.blindRoll ? { blind: true } : {}),
          // we've shown the dice already
          ...(getDiceSoNice()
            ? { flags: { "dice-so-nice": { skip: true } } }
            : {}),
          system: {
            status: "rolled",
            difficulty: {
              base: edit.base,
              hidden: isDifficultyHidden(message, edit.base),
            },
          },
        });
      } catch (error) {
        // back to waiting, so it can be rolled again or withdrawn
        await message.update({ system: { status: "requested" } });
        throw error;
      }
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
