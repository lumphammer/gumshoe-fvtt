import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { settings } from "../../settings/settings";
import { getHealth, getStat, isHumanActor } from "./health";
import type {
  ResolvedAttackTarget,
  TargetActorInfo,
} from "./resolveAttackTarget";
import { resolveAttackTarget } from "./resolveAttackTarget";
import { takeUnusedDamageRoll } from "./attackData";
import type {
  AttackFlagData,
  AttackTargetData,
  DamageRollRecord,
} from "./types";

/** our damage rolls carry data, which plain `Roll` doesn't allow for */
export type AnyRoll = Roll<Record<string, number>>;

export function getAttackFlag(message: ChatMessage): AttackFlagData | null {
  const attack = message.getFlag("investigator", "attack");
  return attack ?? null;
}

export async function setAttackFlag(
  message: ChatMessage,
  attack: AttackFlagData,
): Promise<void> {
  await message.setFlag("investigator", "attack", attack);
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
    return { hitThreshold: null, armor: null, health: null, isHuman: false };
  }
  return {
    hitThreshold: getStat(actor, "hitThreshold"),
    armor: getStat(actor, "armor"),
    health: getHealth(actor),
    isHuman: isHumanActor(actor),
  };
}

export function getResolveOptions() {
  return {
    useCriticalHits: settings.useCriticalHits.get(),
    useGunfireOnHumans: settings.useGunfireOnHumans.get(),
  };
}

export function resolveTargetLive(
  attack: AttackFlagData,
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
  attack: Pick<AttackFlagData, "damageFormula" | "damageParams">,
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
 * becoming a critical hit), starting with the attack's own damage roll if it
 * hasn't been used. Returns the updated attack and target, plus any new rolls
 * so the caller can show them.
 */
export async function fillMissingDamageRolls(
  attack: AttackFlagData,
  target: AttackTargetData,
): Promise<{
  attack: AttackFlagData;
  target: AttackTargetData;
  rolls: AnyRoll[];
}> {
  const taken = takeUnusedDamageRoll(
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
