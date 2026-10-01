import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { requestApplyAttackDamage } from "../../functions/utilities";
import {
  getAttackFlag,
  getTargetActor,
  resolveTargetLive,
  setAttackFlag,
} from "./attackTargets";
import { getHealth, setHealth } from "./health";
import type { AttackTargetData } from "./types";

/**
 * Only the attacker (i.e. the author of the message) and GMs get to fiddle with
 * an attack's targets and apply its damage.
 */
export function canUserActOnAttack(
  user: Pick<User, "id" | "isGM">,
  message: ChatMessage,
): boolean {
  return user.isGM || message.author?.id === user.id;
}

/**
 * Apply or undo damage for one target. This must run on a client which can
 * update both the target actor and the message: the attacker if they own the
 * target, otherwise the GM.
 */
export async function applyAttackDamageLocally(
  message: ChatMessage,
  targetId: string,
  undo: boolean,
): Promise<void> {
  const attack = getAttackFlag(message);
  const target = attack?.targets.find((t) => t.id === targetId);
  if (!attack || !target) return;
  const actor = getTargetActor(target);
  if (!actor) {
    ui.notifications?.warn(getTranslated("AttackTargetNotFound"));
    return;
  }

  let applied: AttackTargetData["applied"];
  if (undo) {
    if (target.applied === null) return;
    await setHealth(actor, target.applied.previousHealth);
    applied = null;
  } else {
    if (target.applied !== null) return;
    const previousHealth = getHealth(actor);
    const { damage } = resolveTargetLive(attack, target);
    if (previousHealth === null || damage === null) return;
    await setHealth(actor, damage.finalHealth);
    applied = { previousHealth, newHealth: damage.finalHealth };
  }

  // re-read in case anything else changed while we were busy
  const latest = getAttackFlag(message) ?? attack;
  await setAttackFlag(message, {
    ...latest,
    targets: latest.targets.map((t) =>
      t.id === targetId ? { ...t, applied } : t,
    ),
  });
}

/**
 * Apply or undo damage, asking the GM to do it if we can't.
 */
export async function applyAttackDamage(
  message: ChatMessage,
  target: AttackTargetData,
  undo: boolean,
): Promise<void> {
  assertGame(game);
  if (!canUserActOnAttack(game.user, message)) return;
  const actor = getTargetActor(target);
  if (actor?.isOwner && message.isOwner) {
    await applyAttackDamageLocally(message, target.id, undo);
  } else if (!game.users.activeGM) {
    ui.notifications?.warn(getTranslated("NoGMToApplyDamage"));
  } else {
    requestApplyAttackDamage({
      messageId: message.id ?? "",
      targetId: target.id,
      undo,
    });
  }
}
