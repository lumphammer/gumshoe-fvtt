import { getTranslated } from "../../functions/getTranslated";
import {
  getAttackData,
  getTargetActor,
  resolveTargetLive,
  setAttackData,
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
 * update both the target actor and the message (see `editAttack`).
 */
export async function applyAttackDamageNow(
  message: ChatMessage,
  targetId: string,
  undo: boolean,
): Promise<void> {
  const attack = getAttackData(message);
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
  const latest = getAttackData(message) ?? attack;
  await setAttackData(message, {
    ...latest,
    targets: latest.targets.map((t) =>
      t.id === targetId ? { ...t, applied } : t,
    ),
  });
}
