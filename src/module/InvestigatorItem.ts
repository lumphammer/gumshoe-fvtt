import { assertGame, fixLength } from "../functions";
import { InvestigatorActor } from "./InvestigatorActor";
import {
  assertAbilityDataSource,
  assertGeneralAbilityDataSource,
  assertEquipmentOrAbilityDataSource,
  assertMwItemDataSource,
  assertWeaponDataSource,
  isEquipmentDataSource,
  assertEquipmentDataSource,
  assertPersonalDetailDataSource,
} from "../typeAssertions";
import {
  EquipmentDataSource,
  MWDifficulty,
  MwRefreshGroup,
  MwType,
  NoteWithFormat,
  RangeTuple,
  SituationalModifier,
  Unlock,
} from "../types";
import * as constants from "../constants";
import { runtimeConfig } from "../runtime";
import { settings } from "../settings";
import { ThemeV1 } from "../themes/types";
import { nanoid } from "nanoid";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class InvestigatorItem extends Item {
  activeSituationalModifiers: string[] = [];

  /**
   * classic gumshoe test: spend a number of points from the pool, and add that
   * to a d6
   */
  async testAbility(spend: number) {
    assertGame(game);
    assertAbilityDataSource(this.data);
    if (this.actor === null) {
      return;
    }
    const isBoosted = settings.useBoost.get() && this.getBoost();
    const boost = isBoosted ? 1 : 0;
    const situationalModifiers = this.activeSituationalModifiers.map((id) => {
      assertAbilityDataSource(this.data);
      const situationalModifier = this.data.data.situationalModifiers.find(
        (situationalModifier) => situationalModifier?.id === id,
      );
      return situationalModifier;
    });

    let rollExpression = "1d6 + @spend";
    const rollValues: Record<string, number> = { spend };
    if (isBoosted) {
      rollExpression += " + @boost";
      rollValues.boost = boost;
    }
    for (const situationalModifier of situationalModifiers) {
      if (situationalModifier === undefined) {
        continue;
      }
      rollExpression += ` + @${situationalModifier.id}`;
      rollValues[situationalModifier.id] = situationalModifier.modifier;
    }

    const roll = new Roll(rollExpression, rollValues);
    await roll.evaluate({ async: true });
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div 
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.data._id}"
          ${constants.htmlDataActorId}="${this.parent?.data._id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeTest}"
          ${constants.htmlDataName}="${this.data.name}"
          ${constants.htmlDataImageUrl}="${this.data.img}"
        />
      `,
    });
    const pool = this.data.data.pool - (Number(spend) || 0);
    this.update({ data: { pool } });
  }

  /**
   * gumshoe spend - no dice, just spend a number of points in exchange for some
   * goodies
   */
  async spendAbility(spend: number) {
    assertAbilityDataSource(this.data);
    if (this.actor === null) {
      return;
    }
    const roll = new Roll("@spend", { spend });
    await roll.evaluate({ async: true });
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.data._id}"
          ${constants.htmlDataActorId}="${this.parent?.data._id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeSpend}"
          ${constants.htmlDataName}="${this.data.name}"
          ${constants.htmlDataImageUrl}="${this.data.img}"
        />
      `,
    });
    const boost = settings.useBoost.get() && this.getBoost() ? 1 : 0;
    const pool = this.data.data.pool - (Number(spend) || 0) + boost;
    this.update({ data: { pool } });
  }

  /**
   * DERPG/"Moribund World" style roll - d6 +/- a difficulty modifier, with an
   * additional boon or levy on the pool. can be re-rolled for one extra point.
   */
  async mwTestAbility(
    difficulty: MWDifficulty,
    boonLevy: number,
    reRoll: number | null = null,
  ) {
    assertGame(game);
    assertAbilityDataSource(this.data);
    if (this.actor === null) {
      return;
    }
    const diffMod = difficulty === "easy" ? 0 : difficulty;
    const operator = diffMod < 0 ? "-" : "+";
    const roll =
      diffMod === 0
        ? new Roll("1d6")
        : new Roll(`1d6 ${operator} @diffMod`, { diffMod: Math.abs(diffMod) });
    await roll.evaluate({ async: true });
    const cost = (reRoll === 1 ? 4 : reRoll === null ? 0 : 1) - boonLevy;
    if (cost > this.data.data.pool) {
      ui.notifications?.error(
        `Attempted to ${reRoll ? `re-roll a ${reRoll} with` : "roll"} ${
          this.data.name
        } with a levy of ${boonLevy} but pool is currently at ${
          this.data.data.pool
        }`,
      );
      return;
    }
    const newPool = Math.max(0, this.data.data.pool - cost);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div 
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.data._id}"
          ${constants.htmlDataActorId}="${this.parent?.data._id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwTest}"
          ${constants.htmlDataMwDifficulty} = ${difficulty}
          ${constants.htmlDataMwBoonLevy} = ${boonLevy}
          ${constants.htmlDataMwReRoll} = ${reRoll === null ? '""' : reRoll}
          ${constants.htmlDataMwPool} = ${newPool}
        />
      `,
    });
    this.update({ data: { pool: newPool } });
  }

  mWNegateIllustrious() {
    assertAbilityDataSource(this.data);
    const newPool = Math.max(0, this.data.data.pool - constants.mwNegateCost);
    ChatMessage.create({
      content: `
        <div 
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.data._id}"
          ${constants.htmlDataActorId}="${this.parent?.data._id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwNegate}"
          ${constants.htmlDataMwPool} = ${newPool}
        />
      `,
    });
    this.update({ data: { pool: newPool } });
  }

  async mWWallop() {
    assertAbilityDataSource(this.data);
    const newPool = Math.max(0, this.data.data.pool - constants.mwWallopCost);
    ChatMessage.create({
      content: `
        <div 
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.data._id}"
          ${constants.htmlDataActorId}="${this.parent?.data._id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwWallop}"
          ${constants.htmlDataMwPool} = ${newPool}
        />
      `,
    });
    this.update({ data: { pool: newPool } });
  }

  /**
   * reset the pool to the rating
   */
  refreshPool() {
    assertAbilityDataSource(this.data);
    this.update({
      data: {
        pool: this.data.data.rating ?? 0,
      },
    });
  }

  // ###########################################################################
  // GETTERS GONNA GET
  // SETTERS GONNA SET
  // basically we have a getter/setter pair for every attribute so they can be
  // used as handy callbacks in the component tree
  // ###########################################################################

  getCategory = () => {
    assertEquipmentOrAbilityDataSource(this.data);
    return this.data.data.category;
  };

  setCategory = (category: string) => {
    assertEquipmentOrAbilityDataSource(this.data);
    const updateData: Pick<EquipmentDataSource["data"], "category" | "fields"> =
      { category, fields: {} };
    if (isEquipmentDataSource(this.data)) {
      const fields = settings.equipmentCategories.get()[category]?.fields ?? {};
      for (const field in fields) {
        updateData.fields[field] =
          this.data.data.fields[field] ?? fields[field].default;
      }
    }
    return this.update({ data: updateData });
  };

  setField = (field: string, value: string | number | boolean) => {
    assertEquipmentDataSource(this.data);
    return this.update({ data: { fields: { [field]: value } } });
  };

  deleteField = (field: string) => {
    assertEquipmentDataSource(this.data);
    return this.update({ [`data.fields.-=${field}`]: null });
  };

  getMin = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.min;
  };

  setMin = (min: number) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { min } });
  };

  getMax = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.max;
  };

  setMax = (max: number) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { max } });
  };

  getOccupational = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.occupational;
  };

  setOccupational = (occupational: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { occupational } });
  };

  getCanBeInvestigative = () => {
    assertGeneralAbilityDataSource(this.data);
    return this.data.data.canBeInvestigative;
  };

  setCanBeInvestigative = (canBeInvestigative: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { canBeInvestigative } });
  };

  getShowTracker = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.showTracker;
  };

  setShowTracker = (showTracker: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { showTracker } });
  };

  getExcludeFromGeneralRefresh = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.excludeFromGeneralRefresh;
  };

  setExcludeFromGeneralRefresh = (excludeFromGeneralRefresh: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { excludeFromGeneralRefresh } });
  };

  getRefreshesDaily = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.refreshesDaily;
  };

  setRefreshesDaily = (refreshesDaily: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { refreshesDaily } });
  };

  getGoesFirstInCombat = () => {
    assertGeneralAbilityDataSource(this.data);
    return this.data.data.goesFirstInCombat;
  };

  setGoesFirstInCombat = (goesFirstInCombat: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { goesFirstInCombat } });
  };

  getSpecialities = () => {
    assertAbilityDataSource(this.data);
    return fixLength(this.data.data.specialities, this.data.data.rating, "");
  };

  setSpecialities = (newSpecs: string[]) => {
    assertAbilityDataSource(this.data);
    return this.update({
      data: {
        specialities: fixLength(newSpecs, this.data.data.rating, ""),
      },
    });
  };

  getRating = (): number => {
    assertAbilityDataSource(this.data);
    return this.data.data.rating ?? 0;
  };

  setRating = (newRating: number) => {
    assertAbilityDataSource(this.data);
    return this.update({
      data: {
        rating: newRating,
        specialities: fixLength(this.data.data.specialities, newRating, ""),
      },
    });
  };

  setRatingRefresh = (newRating: number) => {
    assertAbilityDataSource(this.data);
    return this.update({
      data: {
        rating: newRating,
        pool: newRating,
        specialities: fixLength(this.data.data.specialities, newRating, ""),
      },
    });
  };

  getHasSpecialities = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.hasSpecialities ?? false;
  };

  setHasSpecialities = (hasSpecialities: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({
      data: {
        hasSpecialities,
      },
    });
  };

  setName = (name: string) => {
    return this.update({
      name,
    });
  };

  setCost = (cost: number) => {
    return this.update({
      data: {
        cost,
      },
    });
  };

  setAmmoMax = (max: number) => {
    return this.update({
      data: {
        ammo: {
          max,
        },
      },
    });
  };

  getAmmoMax = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.ammo?.max || 0;
  };

  setAmmo = (value: number) => {
    return this.update({
      data: {
        ammo: {
          value,
        },
      },
    });
  };

  getAmmo = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.ammo?.value || 0;
  };

  reload = () => {
    assertWeaponDataSource(this.data);
    return this.update({
      data: {
        ammo: {
          value: this.getAmmoMax(),
        },
      },
    });
  };

  getAmmoPerShot = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.ammoPerShot ?? 1;
  };

  setAmmoPerShot = (ammoPerShot: number) => {
    assertWeaponDataSource(this.data);
    return this.update({
      data: { ammoPerShot },
    });
  };

  getUsesAmmo = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.usesAmmo ?? false;
  };

  setUsesAmmo = (usesAmmo: boolean) => {
    assertWeaponDataSource(this.data);
    return this.update({
      data: { usesAmmo },
    });
  };

  getTheme(): ThemeV1 {
    const themeName = this.getThemeName();
    const theme = runtimeConfig.themes[themeName];
    return theme;
  }

  getThemeName(): string {
    const systemThemeName = settings.defaultThemeName.get();
    if (this.isOwned) {
      return (
        (this.actor as InvestigatorActor).getSheetThemeName() || systemThemeName
      );
    } else {
      return systemThemeName;
    }
  }

  getNotes = () => {
    return this.data.data.notes ?? "";
  };

  setNotes = async (newNotes: NoteWithFormat) => {
    await this.update({ data: { notes: newNotes } });
  };

  getAbility = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.ability ?? "";
  };

  setAbility = (ability: string) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { ability } });
  };

  getPool = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.pool ?? 0;
  };

  setPool = (pool: number) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { pool } });
  };

  getBoost = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.boost ?? 0;
  };

  setBoost = (boost: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { boost } });
  };

  getDamage = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.damage ?? 0;
  };

  setDamage = (damage: number) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { damage } });
  };

  getPointBlankDamage = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.pointBlankDamage ?? 0;
  };

  setPointBlankDamage = (pointBlankDamage: number) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { pointBlankDamage } });
  };

  getCloseRangeDamage = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.closeRangeDamage ?? 0;
  };

  setCloseRangeDamage = (closeRangeDamage: number) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { closeRangeDamage } });
  };

  getNearRangeDamage = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.nearRangeDamage ?? 0;
  };

  setNearRangeDamage = (nearRangeDamage: number) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { nearRangeDamage } });
  };

  getLongRangeDamage = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.longRangeDamage ?? 0;
  };

  setLongRangeDamage = (longRangeDamage: number) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { longRangeDamage } });
  };

  getIsPointBlank = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.isPointBlank;
  };

  setIsPointBlank = (isPointBlank: boolean) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { isPointBlank } });
  };

  getIsCloseRange = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.isCloseRange;
  };

  setIsCloseRange = (isCloseRange: boolean) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { isCloseRange } });
  };

  getIsNearRange = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.isNearRange;
  };

  setIsNearRange = (isNearRange: boolean) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { isNearRange } });
  };

  getIsLongRange = () => {
    assertWeaponDataSource(this.data);
    return this.data.data.isLongRange;
  };

  setIsLongRange = (isLongRange: boolean) => {
    assertWeaponDataSource(this.data);
    return this.update({ data: { isLongRange } });
  };

  getHideIfZeroRated = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.hideIfZeroRated;
  };

  setHideIfZeroRated = (hideIfZeroRated: boolean) => {
    assertAbilityDataSource(this.data);
    return this.update({ data: { hideIfZeroRated } });
  };

  // ---------------------------------------------------------------------------
  // MW specific fields

  getMwTrumps = () => {
    assertGeneralAbilityDataSource(this.data);
    return this.data.data.mwTrumps;
  };

  setMwTrumps = (mwTrumps: string) => {
    assertGeneralAbilityDataSource(this.data);
    return this.update({ data: { mwTrumps } });
  };

  getMwTrumpedBy = () => {
    assertGeneralAbilityDataSource(this.data);
    return this.data.data.mwTrumpedBy;
  };

  setMwTrumpedBy = (mwTrumpedBy: string) => {
    assertGeneralAbilityDataSource(this.data);
    return this.update({ data: { mwTrumpedBy } });
  };

  getMwType = () => {
    assertMwItemDataSource(this.data);
    return this.data.data.mwType;
  };

  setMwType = (mwType: MwType) => {
    assertMwItemDataSource(this.data);
    return this.update({ data: { mwType } });
  };

  getCharges = () => {
    assertMwItemDataSource(this.data);
    return this.data.data.charges;
  };

  setCharges = (charges: number) => {
    assertMwItemDataSource(this.data);
    return this.update({ data: { charges } });
  };

  getRanges = () => {
    assertMwItemDataSource(this.data);
    return this.data.data.ranges;
  };

  getRange = (range: 0 | 1 | 2 | 3) => {
    assertMwItemDataSource(this.data);
    return this.data.data.ranges[range];
  };

  setRanges = (ranges: [number, number, number, number]) => {
    assertMwItemDataSource(this.data);
    return this.update({ data: { ranges } });
  };

  setRange = (range: 0 | 1 | 2 | 3) => (value: number) => {
    assertMwItemDataSource(this.data);
    const ranges = [...this.data.data.ranges] as RangeTuple;
    ranges[range] = value;
    return this.update({ data: { ranges } });
  };

  getMwRefreshGroup = () => {
    assertGeneralAbilityDataSource(this.data);
    return this.data.data.mwRefreshGroup;
  };

  setMwRefreshGroup = (mwRefreshGroup: MwRefreshGroup) => {
    assertGeneralAbilityDataSource(this.data);
    return this.update({ data: { mwRefreshGroup } });
  };

  getActiveUnlocks = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.unlocks.filter(
      ({ rating: targetRating, description }) => {
        assertAbilityDataSource(this.data);
        return this.data.data.rating >= targetRating && description !== "";
      },
    );
  };

  getVisibleSituationalModifiers = () => {
    assertAbilityDataSource(this.data);
    return this.data.data.situationalModifiers.filter(({ situation }) => {
      assertAbilityDataSource(this.data);
      return situation !== "";
    });
  };

  toggleSituationalModifier = (id: string) => {
    assertAbilityDataSource(this.data);
    if (this.isSituationalModifierActive(id)) {
      const index = this.activeSituationalModifiers.indexOf(id);
      if (index !== -1) {
        this.activeSituationalModifiers.splice(index, 1);
      }
    } else {
      if (!this.activeSituationalModifiers.includes(id)) {
        this.activeSituationalModifiers.push(id);
      }
    }
    this.sheet?.render();
    this.actor?.sheet?.render();
  };

  isSituationalModifierActive = (id: string) => {
    assertAbilityDataSource(this.data);
    return this.activeSituationalModifiers.includes(id);
  };

  setUnlockDescription = (index: number, description: string) => {
    assertAbilityDataSource(this.data);
    const unlocks = [...this.data.data.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      description,
    };
    return this.update({ data: { unlocks } });
  };

  setUnlockRating = (index: number, rating: number) => {
    assertAbilityDataSource(this.data);
    const unlocks = [...this.data.data.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      rating,
    };
    return this.update({ data: { unlocks } });
  };

  deleteUnlock = (index: number) => {
    assertAbilityDataSource(this.data);
    const unlocks = [...this.data.data.unlocks];
    unlocks.splice(index, 1);
    return this.update({ data: { unlocks } });
  };

  addUnlock = () => {
    assertAbilityDataSource(this.data);
    const unlocks: Unlock[] = [
      ...this.data.data.unlocks,
      {
        description: "",
        rating: 0,
        id: nanoid(),
      },
    ];
    return this.update({ data: { unlocks } });
  };

  setSituationalModifierSituation = (index: number, situation: string) => {
    assertAbilityDataSource(this.data);
    const situationalModifiers = [...this.data.data.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      situation,
    };
    return this.update({ data: { situationalModifiers } });
  };

  setSituationalModifierModifier = (index: number, modifier: number) => {
    assertAbilityDataSource(this.data);
    const situationalModifiers = [...this.data.data.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      modifier,
    };
    return this.update({ data: { situationalModifiers } });
  };

  deleteSituationalModifier = (index: number) => {
    assertAbilityDataSource(this.data);
    const situationalModifiers = [...this.data.data.situationalModifiers];
    situationalModifiers.splice(index, 1);
    return this.update({ data: { situationalModifiers } });
  };

  addSituationalModifier = () => {
    assertAbilityDataSource(this.data);
    const situationalModifiers: SituationalModifier[] = [
      ...this.data.data.situationalModifiers,
      {
        situation: "",
        modifier: 0,
        id: nanoid(),
      },
    ];
    return this.update({ data: { situationalModifiers } });
  };

  setCombatBonus = async (combatBonus: number) => {
    assertGeneralAbilityDataSource(this.data);
    await this.update({ data: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number) => {
    assertGeneralAbilityDataSource(this.data);
    await this.update({ data: { damageBonus } });
  };

  setSlotIndex = (slotIndex: number) => {
    assertPersonalDetailDataSource(this.data);
    this.update({
      data: {
        slotIndex,
      },
    });
  };

  setCompendiumPack = (id: string | null) => {
    assertPersonalDetailDataSource(this.data);
    this.update({
      data: {
        compendiumPackId: id,
      },
    });
  };
}

declare global {
  interface DocumentClassConfig {
    Item: typeof InvestigatorItem;
  }
}
