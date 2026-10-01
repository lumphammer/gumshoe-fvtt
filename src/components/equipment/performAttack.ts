import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { assertGame } from "../../functions/isGame";
import { PoolTerm } from "../../fvtt-exports";
import { isNPCActor } from "../../module/actors/npc";
import type { AnyRoll } from "../../module/attacks/attackTargets";
import {
  createAttackTarget,
  fillMissingDamageRolls,
  pickSingleTargetToken,
  rollToRecord,
} from "../../module/attacks/attackTargets";
import { getHealth } from "../../module/attacks/health";
import type { FireMode } from "../../module/attacks/rules";
import { burstMinimumSpend, hurtHealth } from "../../module/attacks/rules";
import type { AttackData } from "../../module/attacks/types";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import type { WeaponItem } from "../../module/items/weapon";
import { settings } from "../../settings/settings";
import { consumeWeaponAmmo } from "./consumeWeaponAmmo";

type PerformAttackArgs1 = {
  spend: number;
  bonusPool: number;
  setSpend: (value: number) => void;
  setBonusPool: (value: number) => void;
  weapon: WeaponItem;
  ability: InvestigatorItem | undefined;
};

type PerformAttackArgs2 = {
  rangeName: string;
  rangeDamage: number;
  fireMode: FireMode;
};

/**
 * Build the attack data. With damage application on, this includes the user's
 * current target: the attack's own damage roll goes to it if it needs one, and
 * anything else needed (e.g. for a critical hit) gets rolled here.
 */
async function buildAttackData({
  fireMode,
  hitRoll,
  damageRoll,
  damageFormula,
  damageParams,
  weapon,
}: {
  fireMode: FireMode;
  hitRoll: AnyRoll;
  damageRoll: AnyRoll;
  damageFormula: string;
  damageParams: Record<string, number>;
  weapon: WeaponItem;
}): Promise<{ attack: AttackData; extraRolls: AnyRoll[] }> {
  assertGame(game);
  const attackerHealth = weapon.actor ? getHealth(weapon.actor) : null;
  let attack: AttackData = {
    fireMode,
    hitTotal: hitRoll.total ?? 0,
    hitDie: hitRoll.dice[0]?.total ?? 0,
    attackerIsHurt: attackerHealth !== null && attackerHealth <= hurtHealth,
    isGunfire: weapon.system.isGunfire,
    lethality: settings.useLethality.get() ? weapon.system.lethality : null,
    damageFormula,
    damageParams,
    unusedDamageRolls: [rollToRecord(damageRoll)],
    targets: [],
  };
  const extraRolls: AnyRoll[] = [];
  if (!settings.useDamageApplication.get()) {
    return { attack, extraRolls };
  }
  // only use targets here, not selection: your selected token is usually
  // the one doing the shooting
  const token = pickSingleTargetToken({ allowSelected: false });
  if (token) {
    const filled = await fillMissingDamageRolls(
      attack,
      createAttackTarget(token),
    );
    extraRolls.push(...filled.rolls);
    attack = { ...filled.attack, targets: [filled.target] };
  }
  return { attack, extraRolls };
}

export const performAttack =
  ({
    spend,
    ability,
    weapon,
    bonusPool,
    setSpend,
    setBonusPool,
  }: PerformAttackArgs1) =>
  async ({ rangeName, rangeDamage, fireMode }: PerformAttackArgs2) => {
    assertGame(game);
    assertAbilityItem(ability);
    if (weapon.actor === null) {
      return;
    }
    // the attack panel shouldn't let these through, but just in case
    if (fireMode === "burst" && spend < burstMinimumSpend) {
      return;
    }
    const damage = weapon.system.damage;

    const useBoost = settings.useBoost.get();
    const isBoosted = useBoost && ability !== undefined && ability.system.boost;
    const boost = isBoosted ? 1 : 0;

    let hitTerm = "1d6 + @spend";
    const hitParams: { [name: string]: number } = { spend };
    if (isBoosted) {
      hitTerm += " + @boost";
      hitParams["boost"] = boost;
    }

    const useNpcBonuses =
      settings.useNpcCombatBonuses.get() &&
      ability?.isOwned &&
      ability.parent &&
      isNPCActor(ability.parent) &&
      isGeneralAbilityItem(ability);

    const parent = ability.parent;
    if (useNpcBonuses) {
      hitTerm += " + @npcCombatBonus";
      if (isNPCActor(parent)) {
        hitParams["npcCombatBonus"] = parent.system.combatBonus;
      }
      hitTerm += " + @abilityCombatBonus";
      hitParams["abilityCombatBonus"] = ability.system.combatBonus;
    }
    const hitRoll = new Roll(hitTerm, hitParams);

    await hitRoll.evaluate();

    hitRoll.dice[0].options = {
      rollOrder: 1,
    };

    hitRoll.dice[0].options.rollOrder = 1;

    let damageTerm = "1d6 + @damage + @rangeDamage";
    const damageParams: { [name: string]: number } = { damage, rangeDamage };
    if (useNpcBonuses) {
      damageTerm += " + @npcDamageBonus";
      if (isNPCActor(parent)) {
        damageParams["npcDamageBonus"] = parent.system.damageBonus;
      }
      damageTerm += " + @abilityDamageBonus";
      damageParams["abilityDamageBonus"] = ability.system.damageBonus;
    }

    const damageRoll = new Roll(damageTerm, damageParams);
    await damageRoll.evaluate();
    damageRoll.dice[0].options.rollOrder = 2;

    const { attack, extraRolls } = await buildAttackData({
      fireMode,
      hitRoll,
      damageRoll,
      damageFormula: damageTerm,
      damageParams,
      weapon,
    });
    extraRolls.forEach((roll, i) => {
      roll.dice[0].options.rollOrder = 3 + i;
    });

    const rolls = [hitRoll, damageRoll, ...extraRolls];
    // @ts-expect-error fvtt-types
    const pool = PoolTerm.fromRolls(rolls);
    const actualRoll = Roll.fromTerms([pool]);

    void actualRoll.toMessage({
      type: "attack",
      speaker: ChatMessage.getSpeaker({ actor: weapon.actor as Actor.Stored }),
      // a bare marker for the card to render into. Without some content,
      // Foundry would fill the message with its own roll display.
      content: buildAbilityCardContent({}),
      system: {
        ...attack,
        weaponUuid: weapon.uuid,
        weaponName: weapon.name,
        weaponImg: weapon.img ?? "",
        rangeName,
      },
    });

    const currentPool = ability?.system.pool ?? 0;
    const poolHit = Math.max(0, Number(spend) - bonusPool);
    const newPool = Math.max(0, currentPool - poolHit);
    const newBonusPool = Math.max(0, bonusPool - Number(spend));
    await ability?.system.setPool(newPool);
    setBonusPool(newBonusPool);
    setSpend(0);
    await consumeWeaponAmmo(weapon.system, fireMode);
  };
