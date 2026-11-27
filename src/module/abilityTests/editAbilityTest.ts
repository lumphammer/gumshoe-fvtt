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

/** the tests this client is rolling */
const rollingHere = new Set<string>();

/** whether this test is still rolling, on this client */
function isRollingHere(message: AbilityTestMessage) {
  return (
    message.system.status === "rolling" &&
    message.system.rollingUserId === game.user?.id
  );
}

/**
 * A test left rolling: by someone who's gone, or by this user before their
 * page reloaded. (Someone who's still here may be watching the dice.)
 */
function isInterruptedRoll(message: AbilityTestMessage) {
  if (message.system.status !== "rolling") return false;
  const { rollingUserId } = message.system;
  if (rollingUserId === game.user?.id) {
    return !rollingHere.has(message.id ?? "");
  }
  return !(rollingUserId && game.users?.get(rollingUserId)?.active);
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
      rollingHere.add(message.id ?? "");
      await message.update({
        system: { status: "rolling", rollingUserId: game.user?.id ?? null },
      });
      try {
        const { formula, params } = message.system;
        const roll: TestRoll = new Roll(formula, { ...params });
        await roll.evaluate();
        await showDice(message, roll);
        // if someone gave up on us while the dice rolled, and put the test
        // back (or then rolled or withdrew it), it isn't ours to finish
        if (!isRollingHere(message)) return;
        await message.update({
          rolls: [JSON.stringify(roll)],
          ...(message.system.blindRoll ? { blind: true } : {}),
          // we've shown the dice already
          ...(getDiceSoNice()
            ? { flags: { "dice-so-nice": { skip: true } } }
            : {}),
          system: {
            status: "rolled",
            rollingUserId: null,
            difficulty: {
              base: edit.base,
              hidden: isDifficultyHidden(message, edit.base),
            },
          },
        });
      } catch (error) {
        // back to waiting, so it can be rolled again or withdrawn
        if (isRollingHere(message)) {
          await message.update({
            system: { status: "requested", rollingUserId: null },
          });
        }
        throw error;
      } finally {
        rollingHere.delete(message.id ?? "");
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
 * Put tests whose roll was interrupted (the page rolling them closed while the
 * dice rolled) back to waiting, so they can be rolled again or withdrawn. The
 * active GM's client does it for everyone; anyone else, for their own rolls
 * (a player rolling with no GM around, who reloaded). Returns the tests it
 * put back.
 */
export async function recoverInterruptedRolls(): Promise<AbilityTestMessage[]> {
  assertGame(game);
  const { user } = game;
  const interrupted = game.messages.contents.flatMap((message) =>
    isAbilityTestMessage(message) &&
    (user.isActiveGM ||
      (message.system.rollingUserId === user.id && message.isOwner)) &&
    isInterruptedRoll(message)
      ? [message]
      : [],
  );
  const recovered = await Promise.all(
    interrupted.map((message) =>
      runExclusive(message.id ?? "", async () => {
        // it may have moved on while it was queued
        if (!isInterruptedRoll(message)) return [];
        await message.update({
          system: { status: "requested", rollingUserId: null },
        });
        return [message];
      }),
    ),
  );
  return recovered.flat();
}

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
