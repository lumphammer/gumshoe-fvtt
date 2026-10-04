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
import { addTarget, replaceTarget, takeUnusedDamageRolls } from "./attackData";
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
    useLethality: settings.useLethalityAndAutofire.get(),
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
    shotDryBonus: false,
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
 * The tokens to use as an attack's targets: the user's targets if they have
 * any, otherwise (if allowed) their selected tokens.
 */
export function pickTargetTokens({
  allowSelected = true,
}: { allowSelected?: boolean } = {}): TokenDocument[] {
  assertGame(game);
  const targeted = Array.from(game.user.targets);
  const tokens =
    targeted.length > 0 || !allowSelected
      ? targeted
      : (canvas?.tokens?.controlled ?? []);
  if (tokens.length === 0 && allowSelected) {
    ui.notifications?.warn(getTranslated("TargetOrSelectATokenFirst"));
  }
  return tokens.map((token) => token.document);
}

/**
 * Add targets for these tokens. They all get added before any damage is
 * rolled (how many dice a target needs can depend on how many others there
 * are, e.g. for Shot Dry), then each takes its share of the attack's unused
 * damage rolls in turn, and rolls anything else it needs.
 */
export async function addTargetsForTokens(
  attack: AttackData,
  tokens: TokenDocument[],
): Promise<{ attack: AttackData; rolls: AnyRoll[] }> {
  let result = attack;
  const newTargetIds: string[] = [];
  for (const token of tokens) {
    const target = createAttackTarget(token);
    const added = addTarget(result, target);
    if (added === result) continue;
    newTargetIds.push(target.id);
    result = added;
  }
  const rolls: AnyRoll[] = [];
  for (const id of newTargetIds) {
    const target = result.targets.find((t) => t.id === id);
    if (!target) continue;
    const filled = await fillMissingDamageRolls(result, target);
    rolls.push(...filled.rolls);
    result = replaceTarget(filled.attack, filled.target);
  }
  return { attack: result, rolls };
}

/**
 * The id of the fight this actor is in: a combat they're a combatant in
 * (preferring the active one), otherwise the viewed scene's combat, or null.
 */
export function getCombatIdFor(actor: Actor): string | null {
  assertGame(game);
  const combats = (game.combats?.contents ?? []).filter((combat) =>
    combat.combatants.some((combatant) => combatant.actor === actor),
  );
  const combat =
    combats.find((c) => c.active) ?? combats[0] ?? game.combat ?? null;
  return combat?.id ?? null;
}

/**
 * The token to use as a single-target attack's target: the user's target if
 * they have one, otherwise their selected token. Warns if there's more than
 * one to choose from.
 */
export function pickSingleTargetToken({
  allowSelected = true,
}: { allowSelected?: boolean } = {}): TokenDocument | null {
  const tokens = pickTargetTokens({ allowSelected });
  if (tokens.length === 0) {
    return null;
  }
  if (tokens.length > 1) {
    ui.notifications?.warn(
      getTranslated("OnlyOneTargetUsingTokenName", {
        TokenName: tokens[0].name ?? "",
      }),
    );
  }
  return tokens[0];
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
