import { createKeyedQueue } from "../../functions/createKeyedQueue";
import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { requestEditAttack } from "../../functions/utilities";
import { applyAttackDamageNow, canUserActOnAttack } from "./applyAttackDamage";
import {
  keepLoneShotDryTarget,
  removeTarget,
  replaceTarget,
  setSingleTarget,
} from "./attackData";
import type { AttackEdit } from "./attackEdits";
import type { AttackMessage } from "./attackTargets";
import {
  addTargetsForTokens,
  createAttackTarget,
  fillMissingDamageRolls,
  getAttackData,
  getTargetActor,
  isAttackMessage,
  setAttackData,
  showRolls,
} from "./attackTargets";
import { walkFireNow } from "./walkingFire";

function getToken(uuid: string): TokenDocument | null {
  const token = fromUuidSync(uuid);
  return token instanceof TokenDocument ? token : null;
}

async function performAttackEditNow(
  message: AttackMessage,
  edit: AttackEdit,
  user: User | null,
): Promise<void> {
  const latest = getAttackData(message);
  if (!latest) return;
  switch (edit.kind) {
    case "updateTarget": {
      // once damage has been applied, a target is settled
      const target = latest.targets.find((t) => t.id === edit.targetId);
      if (!target || target.applied !== null) return;
      await setAttackData(message, {
        ...latest,
        targets: latest.targets.map((t) =>
          t.id === edit.targetId ? { ...t, ...edit.update } : t,
        ),
      });
      return;
    }
    case "removeTarget":
      await setAttackData(message, removeTarget(latest, edit.targetId));
      return;
    case "addTargets": {
      const tokens = edit.tokenUuids
        .map(getToken)
        .filter((token) => token !== null);
      const added = await addTargetsForTokens(
        keepLoneShotDryTarget(latest),
        tokens,
      );
      // nothing new (e.g. they were all targets already)
      if (added.attack.targets.length === latest.targets.length) return;
      await showRolls(added.rolls, user);
      await setAttackData(message, added.attack);
      return;
    }
    case "setTarget": {
      const token = getToken(edit.tokenUuid);
      if (!token || latest.targets.some((t) => t.tokenUuid === token.uuid)) {
        return;
      }
      const filled = await fillMissingDamageRolls(
        latest,
        setSingleTarget(latest, createAttackTarget(token)).targets[0],
      );
      await showRolls(filled.rolls, user);
      await setAttackData(message, {
        ...filled.attack,
        targets: [filled.target],
      });
      return;
    }
    case "rollDamage": {
      const target = latest.targets.find((t) => t.id === edit.targetId);
      if (!target) return;
      const filled = await fillMissingDamageRolls(latest, target);
      await showRolls(filled.rolls, user);
      await setAttackData(message, replaceTarget(filled.attack, filled.target));
      return;
    }
    case "walkFire": {
      const token = getToken(edit.tokenUuid);
      if (!token) return;
      await walkFireNow(message, edit.payment, token);
      return;
    }
    case "applyDamage":
      await applyAttackDamageNow(message, edit.targetId, edit.undo);
      return;
  }
}

const runExclusive = createKeyedQueue();

/**
 * Make a change to an attack card, on this client. Changes to one card run one
 * at a time, each reading the card only once the one before has written it, so
 * none of them can overwrite another. That only holds if they all run on the
 * same client, so this should only be called on the active GM's client (or,
 * with no GM around, by the attacker: then nobody else is making changes).
 *
 * @param requestingUserId whose change it is, if not this user's
 */
export function performAttackEdit(
  message: AttackMessage,
  edit: AttackEdit,
  requestingUserId?: string,
): Promise<void> {
  assertGame(game);
  const user = requestingUserId
    ? (game.users.get(requestingUserId) ?? null)
    : game.user;
  return runExclusive(message.id ?? "", () =>
    performAttackEditNow(message, edit, user),
  );
}

/**
 * Make a change to an attack card: on this client if it's the active GM's,
 * otherwise by asking the GM's client to.
 *
 * @returns "requested" if the GM has been asked to do it, so the caller knows
 * the result will only show up when the message updates.
 */
export async function editAttack(
  message: ChatMessage,
  edit: AttackEdit,
): Promise<"done" | "requested" | "failed"> {
  assertGame(game);
  if (!isAttackMessage(message) || !canUserActOnAttack(game.user, message)) {
    return "failed";
  }
  if (game.user.isActiveGM) {
    await performAttackEdit(message, edit);
    return "done";
  }
  if (game.users.activeGM) {
    requestEditAttack({ messageId: message.id ?? "", edit });
    return "requested";
  }
  // with no GM, we can still change our own card, but not someone else's
  // actor
  if (edit.kind === "applyDamage") {
    const target = getAttackData(message)?.targets.find(
      (t) => t.id === edit.targetId,
    );
    if (target && !getTargetActor(target)?.isOwner) {
      ui.notifications?.warn(getTranslated("NoGMToApplyDamage"));
      return "failed";
    }
  }
  if (!message.isOwner) return "failed";
  await performAttackEdit(message, edit);
  return "done";
}
