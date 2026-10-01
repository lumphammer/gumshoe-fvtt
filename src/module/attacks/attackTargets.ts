import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { settings } from "../../settings/settings";
import {
  getHealth,
  getStat,
  isHumanActor,
  isImmuneToLethality,
} from "./health";
import type {
  ResolvedAttackTarget,
  TargetActorInfo,
} from "./resolveAttackTarget";
import { resolveAttackTarget } from "./resolveAttackTarget";
import { takeUnusedDamageRolls } from "./attackData";
import type { AttackData, AttackTargetData, DamageRollRecord } from "./types";

/** our damage rolls carry data, which plain `Roll` doesn't allow for */
export type AnyRoll = Roll<Record<string, number>>;

export type AttackMessage = ChatMessage.OfType<"attack">;

export function isAttackMessage(
  message: ChatMessage,
): message is AttackMessage {
  return message.type === "attack";
}

/**
 * Get an attack message's data as a plain object, which the rules code can
 * work with and hand back to `setAttackData`.
 */
export function getAttackData(message: ChatMessage): AttackData | null {
  if (!isAttackMessage(message)) return null;
  return message.system.toObject();
}

export async function setAttackData(
  message: ChatMessage,
  attack: AttackData,
): Promise<void> {
  await message.update({ system: attack });
}

export function getTargetActor(target: AttackTargetData): Actor | null {
  const token = fromUuidSync(target.tokenUuid);
  if (!(token instanceof TokenDocument)) {
    return null;
  }
  return token.actor ?? null;
}

export function getTargetActorInfo(actor: Actor | null): TargetActorInfo {
  if (actor === null) {
    return {
      hitThreshold: null,
      armor: null,
      health: null,
      isHuman: false,
      immuneToLethality: false,
    };
  }
  return {
    hitThreshold: getStat(actor, "hitThreshold"),
    armor: getStat(actor, "armor"),
    health: getHealth(actor),
    isHuman: isHumanActor(actor),
    immuneToLethality: isImmuneToLethality(actor),
  };
}

export function getResolveOptions() {
  return {
    useCriticalHits: settings.useCriticalHits.get(),
    useGunfireOnHumans: settings.useGunfireOnHumans.get(),
    useLethality: settings.useLethality.get(),
  };
}

export function resolveTargetLive(
  attack: AttackData,
  target: AttackTargetData,
): ResolvedAttackTarget {
  return resolveAttackTarget(
    attack,
    target,
    getTargetActorInfo(getTargetActor(target)),
    getResolveOptions(),
  );
}

export function rollToRecord(roll: AnyRoll): DamageRollRecord {
  return { die: roll.dice[0]?.total ?? 0, total: roll.total ?? 0 };
}

export async function rollDamage(
  attack: Pick<AttackData, "damageFormula" | "damageParams">,
): Promise<{ roll: AnyRoll; record: DamageRollRecord }> {
  const roll = new Roll(attack.damageFormula, attack.damageParams);
  await roll.evaluate();
  return { roll, record: rollToRecord(roll) };
}

export function createAttackTarget(token: TokenDocument): AttackTargetData {
  return {
    id: foundry.utils.randomID(),
    tokenUuid: token.uuid ?? "",
    name: token.name ?? "",
    img: token.texture.src ?? "",
    cover: "partial",
    armorOverride: null,
    damageRolls: [],
    applied: null,
  };
}

/**
 * Give a target any damage rolls it still needs (e.g. after being added, or
 * becoming a critical hit), starting with any of the attack's unused damage
 * rolls. Returns the updated attack and target, plus any new rolls
 * so the caller can show them.
 */
export async function fillMissingDamageRolls(
  attack: AttackData,
  target: AttackTargetData,
): Promise<{
  attack: AttackData;
  target: AttackTargetData;
  rolls: AnyRoll[];
}> {
  const taken = takeUnusedDamageRolls(
    attack,
    target,
    resolveTargetLive(attack, target).missingRollCount,
  );
  const { missingRollCount } = resolveTargetLive(taken.attack, taken.target);
  const rolls: AnyRoll[] = [];
  const records: DamageRollRecord[] = [];
  for (let i = 0; i < missingRollCount; i++) {
    const { roll, record } = await rollDamage(attack);
    rolls.push(roll);
    records.push(record);
  }
  return {
    attack: taken.attack,
    target: {
      ...taken.target,
      damageRolls: [...taken.target.damageRolls, ...records],
    },
    rolls,
  };
}

/**
 * The token to use as an attack's target: the user's target if they have one,
 * otherwise their selected token. Attacks only have one target for now, so
 * warn if there's more than one to choose from.
 */
export function pickSingleTargetToken({
  allowSelected = true,
}: { allowSelected?: boolean } = {}): TokenDocument | null {
  assertGame(game);
  const targeted = Array.from(game.user.targets);
  const tokens =
    targeted.length > 0 || !allowSelected
      ? targeted
      : (canvas?.tokens?.controlled ?? []);
  if (tokens.length === 0) {
    if (allowSelected) {
      ui.notifications?.warn(getTranslated("TargetOrSelectATokenFirst"));
    }
    return null;
  }
  if (tokens.length > 1) {
    ui.notifications?.warn(
      getTranslated("OnlyOneTargetUsingTokenName", {
        TokenName: tokens[0].document.name ?? "",
      }),
    );
  }
  return tokens[0].document;
}

/** Show rolls made after the message was created, if Dice So Nice is around */
export async function showRolls(rolls: AnyRoll[]): Promise<void> {
  assertGame(game);
  const dice3d = (game as any).dice3d;
  if (!dice3d) return;
  for (const roll of rolls) {
    await dice3d.showForRoll(roll, game.user, true);
  }
}
