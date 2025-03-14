import * as constants from "../../constants";
import { assertGame } from "../../functions/utilities";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { settings } from "../../settings/settings";
import {
  assertAbilityItem,
  assertWeaponItem,
  isGeneralAbilityItem,
  isNPCActor,
} from "../../v10Types";

type PerformAttackArgs1 = {
  spend: number;
  bonusPool: number;
  setSpend: (value: number) => void;
  setBonusPool: (value: number) => void;
  weapon: InvestigatorItem;
  ability: InvestigatorItem | undefined;
};

type PerformAttackArgs2 = {
  rangeName: string;
  rangeDamage: number;
};

export const performAttack =
  ({
    spend,
    ability,
    weapon,
    bonusPool,
    setSpend,
    setBonusPool,
  }: PerformAttackArgs1) =>
  async ({ rangeName, rangeDamage }: PerformAttackArgs2) => {
    assertGame(game);
    assertWeaponItem(weapon);
    assertAbilityItem(ability);
    if (weapon.actor === null) {
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
      // @ts-expect-error merging not working right on this branch of fvtt-types
      rollOrder: 1,
    };

    // @ts-expect-error merging not working right on this branch of fvtt-types
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
    // @ts-expect-error merging not working right on this branch of fvtt-types
    damageRoll.dice[0].options.rollOrder = 2;

    const pool = foundry.dice.terms.PoolTerm.fromRolls([hitRoll, damageRoll]);
    const actualRoll = Roll.fromTerms([pool]);

    const abilityId = ability?._id ?? "";
    const actorId = weapon.actor?._id ?? "";
    const weaponId = weapon._id;

    void actualRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: weapon.actor }),
      content: `
    <div
      class="${constants.abilityChatMessageClassName}"
      ${constants.htmlDataItemId}="${abilityId}"
      ${constants.htmlDataActorId}="${actorId}"
      ${constants.htmlDataMode}="${constants.htmlDataModeAttack}"
      ${constants.htmlDataRange}="${rangeName}"
      ${constants.htmlDataWeaponId}="${weaponId}"
      ${constants.htmlDataName}="${weapon.name}"
      ${constants.htmlDataImageUrl}="${weapon.img}"
    />
  `,
    });

    const currentPool = ability?.system.pool ?? 0;
    const poolHit = Math.max(0, Number(spend) - bonusPool);
    const newPool = Math.max(0, currentPool - poolHit);
    const newBonusPool = Math.max(0, bonusPool - Number(spend));
    await ability?.setPool(newPool);
    setBonusPool(newBonusPool);
    setSpend(0);
    await weapon.setAmmo(
      Math.max(0, weapon.system.ammo.value - weapon.system.ammoPerShot),
    );
  };
