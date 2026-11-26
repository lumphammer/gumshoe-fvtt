// The GM's changes to an ability test's card. Only GMs make them, and each
// writes one field, so unlike attack edits they don't need to go through one
// client.

import { assertGame } from "../../functions/isGame";
import { isAbilityTestMessage } from "./AbilityTestMessageModel";

/**
 * Change the Difficulty a test is against (before its modifiers), or unset it
 * (null) to leave the test waiting for one
 */
export async function setAbilityTestDifficulty(
  message: ChatMessage,
  base: number | null,
): Promise<void> {
  assertGame(game);
  if (
    !game.user.isGM ||
    !isAbilityTestMessage(message) ||
    message.system.difficulty === null ||
    (base !== null && !Number.isInteger(base))
  ) {
    return;
  }
  await message.update({ system: { difficulty: { base } } });
}

/** Show or hide a test's Difficulty and outcome from players */
export async function setAbilityTestRevealed(
  message: ChatMessage,
  revealed: boolean,
): Promise<void> {
  assertGame(game);
  if (
    !game.user.isGM ||
    !isAbilityTestMessage(message) ||
    message.system.difficulty === null
  ) {
    return;
  }
  await message.update({ system: { difficulty: { revealed } } });
}
