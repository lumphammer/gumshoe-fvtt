// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */
import { nanoid } from "nanoid";

import * as constants from "../constants";
import { assertGame, fixLength, getById } from "../functions/utilities";
import { settings } from "../settings/settings";
import {
  CardSystemData,
  EquipmentSystemData,
  MWDifficulty,
  MwRefreshGroup,
  MwType,
  NoteWithFormat,
  RangeTuple,
  SituationalModifier,
  SpecialitiesMode,
  Unlock,
} from "../types";
import {
  assertAbilityItem,
  assertAnyItem,
  assertCardItem,
  assertEquipmentItem,
  assertEquipmentOrAbilityItem,
  assertGeneralAbilityItem,
  assertInvestigativeAbilityItem,
  assertMwItem,
  assertPersonalDetailItem,
  assertWeaponItem,
  InvestigativeAbilityItem,
  isEquipmentItem,
  isGeneralAbilityItem,
  isInvestigativeAbilityItem,
} from "../v10Types";
import { InvestigatorActor } from "./InvestigatorActor";

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
  async testAbility(spend: number): Promise<void> {
    assertGame(game);
    assertAbilityItem(this);
    if (this.actor === null) {
      return;
    }
    const isBoosted = settings.useBoost.get() && this.system.boost;
    const boost = isBoosted ? 1 : 0;
    const situationalModifiers = this.activeSituationalModifiers.map((id) => {
      assertAbilityItem(this);
      const situationalModifier = this.system.situationalModifiers.find(
        (situationalModifier) => situationalModifier?.id === id,
      );
      return situationalModifier;
    });

    let rollExpression = "1d6 + @spend";
    const rollValues: Record<string, number> = { spend };
    if (isBoosted) {
      rollExpression += " + @boost";
      rollValues["boost"] = boost;
    }
    for (const situationalModifier of situationalModifiers) {
      if (situationalModifier === undefined) {
        continue;
      }
      rollExpression += ` + @${situationalModifier.id}`;
      rollValues[situationalModifier.id] = situationalModifier.modifier;
    }

    const roll = new Roll(rollExpression, rollValues);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
      }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id ?? ""}"
          ${constants.htmlDataMode}="${constants.htmlDataModeTest}"
          ${constants.htmlDataName}="${this.name}"
          ${constants.htmlDataImageUrl}="${this.img}"
          ${constants.htmlDataTokenId}="${this.parent?.token?.id ?? ""}"
        />
      `,
    });
    const pool = this.system.pool - (Number(spend) || 0);
    await this.update({ system: { pool } });
  }

  /**
   * gumshoe spend - no dice, just spend a number of points in exchange for some
   * goodies
   */
  async spendAbility(spend: number): Promise<void> {
    assertAbilityItem(this);
    if (this.actor === null) {
      return;
    }
    const roll = new Roll("@spend", { spend });
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
      }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id ?? ""}"
          ${constants.htmlDataMode}="${constants.htmlDataModeSpend}"
          ${constants.htmlDataName}="${this.name}"
          ${constants.htmlDataImageUrl}="${this.img}"
          ${constants.htmlDataTokenId}="${this.parent?.token?.id ?? ""}"
        />
      `,
    });
    const boost = settings.useBoost.get() && this.system.boost ? 1 : 0;
    const pool = this.system.pool - (Number(spend) || 0) + boost;
    await this.update({ system: { pool } });
  }

  /**
   * Expend one point from a push pool
   */
  async push(): Promise<void> {
    if (isGeneralAbilityItem(this)) {
      await this.pushPool();
    } else if (isInvestigativeAbilityItem(this)) {
      await this.pushInvestigative();
    } else {
      throw new Error(
        `Item ${this.name} is not a push pool or a QuickShock ability`,
      );
    }
  }

  async pushPool(from?: InvestigativeAbilityItem): Promise<void> {
    assertGeneralAbilityItem(this);
    if (!this.system.isPushPool) {
      throw new Error(`This ability ${this.name} is not a push pool`);
    }
    if (this.actor === null) {
      return;
    }
    if (this.system.pool === 0) {
      return;
    }
    const roll = new Roll("1");
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
      }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${from?.id ?? this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id ?? ""}"
          ${constants.htmlDataMode}="${constants.htmlDataModePush}"
          ${constants.htmlDataName}="${from?.name ?? this.name}"
          ${constants.htmlDataImageUrl}="${this.img}"
          ${constants.htmlDataTokenId}="${this.parent?.token?.id ?? ""}"
        />
      `,
    });
    const pool = this.system.pool - 1;
    await this.update({ system: { pool } });
  }

  async pushInvestigative(): Promise<void> {
    assertInvestigativeAbilityItem(this);
    if (!this.system.isQuickShock) {
      throw new Error(`The ability ${this.name} is not a quick shock`);
    }
    if (this.actor === null) {
      throw new Error(`The ability ${this.name} is not owned`);
    }
    const poolAbility = this.actor.getPushPool();
    if (poolAbility === undefined) {
      throw new Error(`The actor ${this.actor.name} has no push pool`);
    }
    await poolAbility.pushPool(this);
  }

  /**
   * DERPG/"Moribund World" style roll - d6 +/- a difficulty modifier, with an
   * additional boon or levy on the pool. can be re-rolled for one extra point.
   */
  async mwTestAbility(
    difficulty: MWDifficulty,
    boonLevy: number,
    reRoll: number | null = null,
  ): Promise<void> {
    assertGame(game);
    assertAbilityItem(this);
    if (this.actor === null) {
      return;
    }
    const diffMod = difficulty === "easy" ? 0 : difficulty;
    const operator = diffMod < 0 ? "-" : "+";
    const roll =
      diffMod === 0
        ? new Roll("1d6")
        : new Roll(`1d6 ${operator} @diffMod`, { diffMod: Math.abs(diffMod) });
    await roll.evaluate();
    const cost = (reRoll === 1 ? 4 : reRoll === null ? 0 : 1) - boonLevy;
    if (cost > this.system.pool) {
      ui.notifications?.error(
        `Attempted to ${reRoll ? `re-roll a ${reRoll} with` : "roll"} ${
          this.name
        } with a levy of ${boonLevy} but pool is currently at ${
          this.system.pool
        }`,
      );
      return;
    }
    const newPool = Math.max(0, this.system.pool - cost);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
      }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id ?? ""}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwTest}"
          ${constants.htmlDataMwDifficulty} = ${difficulty}
          ${constants.htmlDataMwBoonLevy} = ${boonLevy}
          ${constants.htmlDataMwReRoll} = ${reRoll === null ? '""' : reRoll}
          ${constants.htmlDataMwPool} = ${newPool}
          ${constants.htmlDataTokenId}="${this.parent?.token?.id ?? ""}"
        />
      `,
    });
    await this.update({ system: { pool: newPool } });
  }

  async mWNegateIllustrious(): Promise<void> {
    assertAbilityItem(this);
    const newPool = Math.max(0, this.system.pool - constants.mwNegateCost);
    // @ts-expect-error .create
    await ChatMessage.create({
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwNegate}"
          ${constants.htmlDataMwPool} = ${newPool}
        />
      `,
    });
    await this.update({ system: { pool: newPool } });
  }

  async mWWallop(): Promise<void> {
    assertAbilityItem(this);
    const newPool = Math.max(0, this.system.pool - constants.mwWallopCost);
    // @ts-expect-error .create
    await ChatMessage.create({
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${this.id}"
          ${constants.htmlDataActorId}="${this.parent?.id}"
          ${constants.htmlDataMode}="${constants.htmlDataModeMwWallop}"
          ${constants.htmlDataMwPool} = ${newPool}
        />
      `,
    });
    await this.update({ system: { pool: newPool } });
  }

  /**
   * reset the pool to the rating
   */
  async refreshPool(): Promise<void> {
    assertAbilityItem(this);
    await this.update({
      system: {
        pool: this.system.rating ?? 0,
      },
    });
  }

  // ###########################################################################
  // GETTERS GONNA GET
  // SETTERS GONNA SET
  // basically we have a getter/setter pair for every attribute so they can be
  // used as handy callbacks in the component tree
  // ###########################################################################

  setCategoryId = async (categoryId: string): Promise<void> => {
    assertEquipmentOrAbilityItem(this);
    const updateData: Pick<EquipmentSystemData, "categoryId" | "fields"> = {
      categoryId,
      fields: {},
    };
    if (isEquipmentItem(this)) {
      const fields =
        settings.equipmentCategories.get()[categoryId]?.fields ?? {};
      for (const field in fields) {
        updateData.fields[field] =
          this.system.fields[field] ?? fields[field].default;
      }
    }
    await this.update({ system: updateData });
  };

  setField = async (
    field: string,
    value: string | number | boolean,
  ): Promise<void> => {
    assertEquipmentItem(this);
    await this.update({ system: { fields: { [field]: value } } });
  };

  deleteField = async (field: string): Promise<this | undefined> => {
    assertEquipmentItem(this);
    return await this.update({ [`system.fields.-=${field}`]: null });
  };

  setMin = (min: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { min } });
  };

  setMax = (max: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { max } });
  };

  setOccupational = (occupational: boolean): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { occupational } });
  };

  setCanBeInvestigative = (
    canBeInvestigative: boolean,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { canBeInvestigative } });
  };

  setShowTracker = (showTracker: boolean): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { showTracker } });
  };

  setExcludeFromGeneralRefresh = (
    excludeFromGeneralRefresh: boolean,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { excludeFromGeneralRefresh } });
  };

  setRefreshesDaily = (refreshesDaily: boolean): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { refreshesDaily } });
  };

  setGoesFirstInCombat = (
    goesFirstInCombat: boolean,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { goesFirstInCombat } });
  };

  getSpecialities = (): string[] => {
    assertAbilityItem(this);
    return fixLength(this.system.specialities, this.getSpecialitesCount(), "");
  };

  getSpecialitesCount = (): number => {
    assertAbilityItem(this);
    if (!this.system.hasSpecialities) {
      return 0;
    } else if (this.system.specialitiesMode === "twoThreeFour") {
      // NBA langauges style
      switch (this.system.rating) {
        case 0:
          return 0;
        case 1:
          return 2;
        case 2:
          return 5;
        default:
          return Math.max(0, (this.system.rating - 2) * 4 + 5);
      }
    } else {
      return this.system.rating;
    }
  };

  setSpecialities = (newSpecs: string[]): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({
      system: {
        specialities: fixLength(newSpecs, this.getSpecialitesCount(), ""),
      },
    });
  };

  setRating = (newRating: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({
      system: {
        rating: newRating,
        specialities: fixLength(this.system.specialities, newRating, ""),
      },
    });
  };

  setRatingAndRefreshPool = (newRating: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({
      system: {
        rating: newRating,
        pool: newRating,
        specialities: fixLength(this.system.specialities, newRating, ""),
      },
    });
  };

  setHasSpecialities = (
    hasSpecialities: boolean,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({
      system: {
        hasSpecialities,
      },
    });
  };

  setName = (name: string): Promise<this | undefined> => {
    return this.update({
      name,
    });
  };

  setCost = (cost: number): Promise<this | undefined> => {
    return this.update({
      system: {
        cost,
      },
    });
  };

  setAmmoMax = (max: number): Promise<this | undefined> => {
    return this.update({
      system: {
        ammo: {
          max,
        },
      },
    });
  };

  setAmmo = (value: number): Promise<this | undefined> => {
    return this.update({
      system: {
        ammo: {
          value,
        },
      },
    });
  };

  reload = async (): Promise<void> => {
    assertWeaponItem(this);
    await this.update({
      system: {
        ammo: {
          value: this.system.ammo.max,
        },
      },
    });
  };

  setAmmoPerShot = async (ammoPerShot: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({
      system: { ammoPerShot },
    });
  };

  setUsesAmmo = async (usesAmmo: boolean): Promise<void> => {
    assertWeaponItem(this);
    await this.update({
      system: { usesAmmo },
    });
  };

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

  getNotes = (): NoteWithFormat => {
    assertAnyItem(this);
    return (
      this.system.notes ?? {
        format: "richtext",
        value: "",
        html: "",
      }
    );
  };

  setNotes = async (newNotes: NoteWithFormat): Promise<void> => {
    await this.update({ system: { notes: newNotes } });
  };

  setAbility = async (ability: string): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { ability } });
  };

  setPool = (pool: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { pool } });
  };

  setBoost = (boost: boolean): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { boost } });
  };

  setDamage = async (damage: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { damage } });
  };

  setPointBlankDamage = async (pointBlankDamage: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { pointBlankDamage } });
  };

  setCloseRangeDamage = async (closeRangeDamage: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { closeRangeDamage } });
  };

  setNearRangeDamage = async (nearRangeDamage: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { nearRangeDamage } });
  };

  setLongRangeDamage = async (longRangeDamage: number): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { longRangeDamage } });
  };

  setIsPointBlank = async (isPointBlank: boolean): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { isPointBlank } });
  };

  setIsCloseRange = async (isCloseRange: boolean): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { isCloseRange } });
  };

  setIsNearRange = async (isNearRange: boolean): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { isNearRange } });
  };

  setIsLongRange = async (isLongRange: boolean): Promise<void> => {
    assertWeaponItem(this);
    await this.update({ system: { isLongRange } });
  };

  setHideIfZeroRated = async (hideIfZeroRated: boolean): Promise<void> => {
    assertAbilityItem(this);
    await this.update({ system: { hideIfZeroRated } });
  };

  setActive = async (active: boolean): Promise<void> => {
    assertCardItem(this);
    await this.update({ system: { active } });
  };

  setContinuity = async (continuity: boolean): Promise<void> => {
    assertCardItem(this);
    await this.update({ system: { continuity } });
  };

  // ---------------------------------------------------------------------------
  // MW specific fields

  setMwTrumps = (mwTrumps: string): Promise<this | undefined> => {
    assertGeneralAbilityItem(this);
    return this.update({ system: { mwTrumps } });
  };

  setMwTrumpedBy = (mwTrumpedBy: string): Promise<this | undefined> => {
    assertGeneralAbilityItem(this);
    return this.update({ system: { mwTrumpedBy } });
  };

  setMwType = async (mwType: MwType): Promise<void> => {
    assertMwItem(this);
    await this.update({ system: { mwType } });
  };

  setCharges = async (charges: number): Promise<void> => {
    assertMwItem(this);
    await this.update({ system: { charges } });
  };

  getRange = (range: 0 | 1 | 2 | 3): number => {
    assertMwItem(this);
    return this.system.ranges[range];
  };

  setRanges = async (
    ranges: [number, number, number, number],
  ): Promise<void> => {
    assertMwItem(this);
    await this.update({ system: { ranges } });
  };

  setRange =
    (range: 0 | 1 | 2 | 3) =>
    async (value: number): Promise<void> => {
      assertMwItem(this);
      const ranges = [...this.system.ranges] as RangeTuple;
      ranges[range] = value;
      await this.update({ system: { ranges } });
    };

  setMwRefreshGroup = async (mwRefreshGroup: MwRefreshGroup): Promise<void> => {
    assertGeneralAbilityItem(this);
    await this.update({ system: { mwRefreshGroup } });
  };

  getActiveUnlocks = (): Unlock[] => {
    assertAbilityItem(this);
    return this.system.unlocks.filter(
      ({ rating: targetRating, description }) => {
        assertAbilityItem(this);
        return this.system.rating >= targetRating && description !== "";
      },
    );
  };

  getVisibleSituationalModifiers = (): SituationalModifier[] => {
    assertAbilityItem(this);
    return this.system.situationalModifiers.filter(({ situation }) => {
      assertAbilityItem(this);
      return situation !== "";
    });
  };

  toggleSituationalModifier = (id: string): void => {
    assertAbilityItem(this);
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

  isSituationalModifierActive = (id: string): boolean => {
    assertAbilityItem(this);
    return this.activeSituationalModifiers.includes(id);
  };

  setUnlockDescription = (
    index: number,
    description: string,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    const unlocks = [...this.system.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      description,
    };
    return this.update({ system: { unlocks } });
  };

  setUnlockRating = (
    index: number,
    rating: number,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    const unlocks = [...this.system.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      rating,
    };
    return this.update({ system: { unlocks } });
  };

  deleteUnlock = (index: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    const unlocks = [...this.system.unlocks];
    unlocks.splice(index, 1);
    return this.update({ system: { unlocks } });
  };

  addUnlock = (): Promise<this | undefined> => {
    assertAbilityItem(this);
    const unlocks: Unlock[] = [
      ...this.system.unlocks,
      {
        description: "",
        rating: 0,
        id: nanoid(),
      },
    ];
    return this.update({ system: { unlocks } });
  };

  setSituationalModifierSituation = (
    index: number,
    situation: string,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    const situationalModifiers = [...this.system.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      situation,
    };
    return this.update({ system: { situationalModifiers } });
  };

  setSituationalModifierModifier = (
    index: number,
    modifier: number,
  ): Promise<this | undefined> => {
    assertAbilityItem(this);
    const situationalModifiers = [...this.system.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      modifier,
    };
    return this.update({ system: { situationalModifiers } });
  };

  deleteSituationalModifier = (index: number): Promise<this | undefined> => {
    assertAbilityItem(this);
    const situationalModifiers = [...this.system.situationalModifiers];
    situationalModifiers.splice(index, 1);
    return this.update({ system: { situationalModifiers } });
  };

  addSituationalModifier = (): Promise<this | undefined> => {
    assertAbilityItem(this);
    const situationalModifiers: SituationalModifier[] = [
      ...this.system.situationalModifiers,
      {
        situation: "",
        modifier: 0,
        id: nanoid(),
      },
    ];
    return this.update({ system: { situationalModifiers } });
  };

  setCombatBonus = async (combatBonus: number): Promise<void> => {
    assertGeneralAbilityItem(this);
    await this.update({ system: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number): Promise<void> => {
    assertGeneralAbilityItem(this);
    await this.update({ system: { damageBonus } });
  };

  setSlotIndex = async (slotIndex: number): Promise<void> => {
    assertPersonalDetailItem(this);
    await this.update({
      system: {
        slotIndex,
      },
    });
  };

  setCompendiumPack = async (id: string | null): Promise<void> => {
    assertPersonalDetailItem(this);
    await this.update({
      system: {
        compendiumPackId: id,
      },
    });
  };

  setSpecialitiesMode = (mode: SpecialitiesMode): Promise<this | undefined> => {
    assertAbilityItem(this);
    return this.update({ system: { specialitiesMode: mode } });
  };

  // cards stuff

  setSupertitle = (supertitle: string): Promise<this | undefined> => {
    assertCardItem(this);
    return this.update({ system: { supertitle } });
  };

  setSubtitle = (subtitle: string): Promise<this | undefined> => {
    assertCardItem(this);
    return this.update({ system: { subtitle } });
  };

  setDescription = (description: NoteWithFormat): Promise<this | undefined> => {
    assertCardItem(this);
    return this.update({ system: { description } });
  };

  setEffects = (effects: NoteWithFormat): Promise<this | undefined> => {
    assertCardItem(this);
    return this.update({ system: { effects } });
  };

  setIsPushPool = async (isPushPool: boolean): Promise<void> => {
    assertGeneralAbilityItem(this);
    await this.update({ system: { isPushPool } });
  };

  setAllowPoolToExceedRating = async (
    allowPoolToExceedRating: boolean,
  ): Promise<void> => {
    assertGeneralAbilityItem(this);
    await this.update({ system: { allowPoolToExceedRating } });
  };

  setIsQuickShock = async (isQuickShock: boolean): Promise<void> => {
    assertInvestigativeAbilityItem(this);
    await this.update({ system: { isQuickShock } });
  };

  addCardCategoryMembership = async (
    newStyleKeyCategoryId: string,
  ): Promise<void> => {
    assertCardItem(this);
    // bail if we already have this category
    if (
      this.system.cardCategoryMemberships.some(
        (m) => m.categoryId === newStyleKeyCategoryId,
      )
    ) {
      return;
    }
    const existingStyleKeyCategoryId = this.system.styleKeyCategoryId;
    const existingStyleKeyCategory =
      existingStyleKeyCategoryId === null
        ? null
        : getById(settings.cardCategories.get(), existingStyleKeyCategoryId);
    const existingStyleKeyCategoryMembership =
      this.system.cardCategoryMemberships.find(
        (m) => m.categoryId === existingStyleKeyCategoryId,
      );
    // if we don't already have a styleKeyCategoryId,
    // or (the styleKeyCategoryId doesn't map to a real category)
    // or we don't have a memberhip for the styleKeyCategoryId
    const styleKeyCategoryId =
      existingStyleKeyCategoryId === null ||
      !existingStyleKeyCategory ||
      !existingStyleKeyCategoryMembership
        ? newStyleKeyCategoryId
        : existingStyleKeyCategoryId;

    const updateData: Pick<
      CardSystemData,
      "cardCategoryMemberships" | "styleKeyCategoryId"
    > = {
      cardCategoryMemberships: [
        ...this.system.cardCategoryMemberships,
        {
          categoryId: newStyleKeyCategoryId,
          nonlethal: false,
          worth: 1,
        },
      ],
      styleKeyCategoryId,
    };
    await this.update({ system: updateData });
  };

  removeCardCategoryMembership = async (categoryId: string): Promise<void> => {
    assertCardItem(this);
    const updateData: Pick<
      CardSystemData,
      "cardCategoryMemberships" | "styleKeyCategoryId"
    > = {
      cardCategoryMemberships: this.system.cardCategoryMemberships.filter(
        (m) => m.categoryId !== categoryId,
      ),
      styleKeyCategoryId: this.system.styleKeyCategoryId,
    };
    if (this.system.styleKeyCategoryId === categoryId) {
      const validMemberCategories = settings.cardCategories
        .get()
        .filter((m) =>
          updateData.cardCategoryMemberships.some((c) => c.categoryId === m.id),
        );
      updateData.styleKeyCategoryId =
        validMemberCategories.length > 0 ? validMemberCategories[0].id : null;
    }
    await this.update({ system: updateData });
  };

  setCardCategoryMembershipNonlethal = async (
    categoryId: string,
    nonlethal: boolean,
  ): Promise<void> => {
    assertCardItem(this);
    const updateData: Pick<CardSystemData, "cardCategoryMemberships"> = {
      cardCategoryMemberships: this.system.cardCategoryMemberships.map((m) => {
        if (m.categoryId === categoryId) {
          return {
            ...m,
            nonlethal,
          };
        } else {
          return m;
        }
      }),
    };
    await this.update({ system: updateData });
  };

  setCardCategoryMembershipWorth = async (
    categoryId: string,
    worth: number,
  ): Promise<void> => {
    assertCardItem(this);
    const updateData: Pick<CardSystemData, "cardCategoryMemberships"> = {
      cardCategoryMemberships: this.system.cardCategoryMemberships.map((m) => {
        if (m.categoryId === categoryId) {
          return {
            ...m,
            worth,
          };
        } else {
          return m;
        }
      }),
    };
    await this.update({ system: updateData });
  };

  setCardStyleKeyCategoryId = async (
    categoryId: string | null,
  ): Promise<void> => {
    assertCardItem(this);
    const updateData: Pick<CardSystemData, "styleKeyCategoryId"> = {
      styleKeyCategoryId: categoryId,
    };
    await this.update({ system: updateData });
  };

  unsetCardStyleKeyCategoryId = async (): Promise<void> => {
    assertCardItem(this);
    const updateData: Pick<CardSystemData, "styleKeyCategoryId"> = {
      styleKeyCategoryId: null,
    };
    await this.update({ system: updateData });
  };
}
