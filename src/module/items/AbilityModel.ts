import { nanoid } from "nanoid";

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { maybeNotesObjectToString } from "../../functions/maybeNotesObjectToString";
import { migrateValue } from "../../functions/migrateValue";
import { TypeDataModel } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import type {
  MWDifficulty,
  SituationalModifier,
  SpecialitiesMode,
  Unlock,
} from "../../types";
import type { PCModel } from "../actors/pc";
import { getCappedRating, getRefreshedPool } from "../bonds/adaptation";
import { serializeBondSpends } from "../bonds/bondSpends";
import type { StabilityState } from "../stability/states";
import { isShakenOrWorse } from "../stability/states";
import { clampBondPoints, getMaxBondSpend } from "../bonds/rules";
import type { BondItem } from "./bond";
import type { AbilitySchema } from "./createAbilitySchema";
import { migrateCategoryToCategoryId } from "./migrateCategoryToCategoryId";
import { getSpecialitiesCount, resizeSpecialities } from "./resizeSpecialities";

/**
 * AbilityModel
 */
export abstract class AbilityModel<
  TSchema extends AbilitySchema,
  TParent extends Item.Stored,
> extends TypeDataModel<TSchema, TParent> {
  static migrateData(source) {
    migrateValue(source, "notes", maybeNotesObjectToString);
    migrateCategoryToCategoryId(source);
    return super.migrateData(source);
  }

  /**
   * The situational modifiers that are currently active
   */
  activeSituationalModifiers: string[] = [];

  /**
   * classic gumshoe test: spend a number of points from the pool, and add that
   * to a d6. Points from Bonds (Fall of DELTA GREEN, p. 120) add to the roll
   * too.
   */
  async testAbility(
    spend: number,
    bondSpends: { bond: BondItem; spend: number }[] = [],
  ): Promise<void> {
    if (this.parent.parent === null) {
      return;
    }
    const usedBondSpends = bondSpends.filter(
      (bondSpend) => bondSpend.spend > 0,
    );
    // the sheet only offers what each Bond can spare, but it may be out of date
    const overspent = usedBondSpends.find(
      ({ bond, spend }) =>
        bond.parent !== this.parent.parent ||
        spend > getMaxBondSpend(bond.system.points),
    );
    if (overspent) {
      ui.notifications?.warn(
        getTranslated("BondCantSpareThatMany", {
          BondName: overspent.bond.name ?? "",
        }),
      );
      return;
    }
    const bondTotal = usedBondSpends.reduce(
      (total, bondSpend) => total + bondSpend.spend,
      0,
    );
    // Shaken (or worse): General tests are at +1 Difficulty (Fall of DELTA
    // GREEN, p. 113). Tests don't have a Difficulty yet, so the card says so.
    const stabilityState = this.getOwnerStabilityState();
    const shakenState =
      this.parent.type === constants.generalAbility &&
      stabilityState !== null &&
      isShakenOrWorse(stabilityState)
        ? stabilityState
        : null;
    const isBoosted = settings.useBoost.get() && this.boost;
    const boost = isBoosted ? 1 : 0;
    const situationalModifiers = this.activeSituationalModifiers.map((id) => {
      const situationalModifier = this.situationalModifiers.find(
        (situationalModifier) => situationalModifier?.id === id,
      );
      return situationalModifier;
    });

    let rollExpression = "1d6 + @spend";
    const rollValues: Record<string, number> = { spend };
    if (bondTotal > 0) {
      rollExpression += " + @bonds";
      rollValues["bonds"] = bondTotal;
    }
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
        actor: this.parent.actor as Actor.Stored,
      }),
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: this.parent.id,
        [constants.htmlDataActorId]: this.parent.parent?.id,
        [constants.htmlDataMode]: constants.htmlDataModeTest,
        [constants.htmlDataName]: this.parent.name,
        [constants.htmlDataImageUrl]: this.parent.img,
        [constants.htmlDataTokenId]: this.parent.parent?.token?.id,
        [constants.htmlDataStabilityState]: shakenState,
        [constants.htmlDataBondSpends]: serializeBondSpends(
          usedBondSpends.map(({ bond, spend }) => ({
            name: bond.name ?? "",
            spend,
          })),
        ),
      }),
    });
    const pool = this.pool - (Number(spend) || 0);
    await this.parent.update({ system: { pool } });
    if (usedBondSpends.length > 0) {
      await this.parent.parent.updateEmbeddedDocuments(
        "Item",
        usedBondSpends.map(({ bond, spend }) => ({
          _id: bond.id,
          system: { points: clampBondPoints(bond.system.points - spend) },
        })),
      );
    }
  }

  /**
   * Spend, but ask first if it's an Investigative ability and the owner is
   * Shaken (or worse): they can't spend Investigative points (Fall of DELTA
   * GREEN, p. 113), though the GM may allow it.
   */
  confirmSpendAbility = async (spend: number): Promise<void> => {
    const state = this.getOwnerStabilityState();
    if (
      spend > 0 &&
      this.parent.type === constants.investigativeAbility &&
      state !== null &&
      isShakenOrWorse(state)
    ) {
      const yes = await confirmADoodleDo({
        message: "SpendWhileShakenConfirm",
        confirmText: "Spend",
        cancelText: "Cancel",
        confirmIconClass: "fa-check",
        resolveFalseOnCancel: true,
        values: {
          ActorName: this.parent.actor?.name ?? "",
          AbilityName: this.parent.name ?? "",
        },
      });
      if (!yes) {
        return;
      }
    }
    await this.spendAbility(spend);
  };

  /**
   * gumshoe spend - no dice, just spend a number of points in exchange for some
   * goodies
   */
  async spendAbility(spend: number): Promise<void> {
    if (this.parent.parent === null) {
      return;
    }
    const roll = new Roll("@spend", { spend });
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.parent.actor as Actor.Stored,
      }),
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: this.parent.id,
        [constants.htmlDataActorId]: this.parent.parent?.id,
        [constants.htmlDataMode]: constants.htmlDataModeSpend,
        [constants.htmlDataName]: this.parent.name,
        [constants.htmlDataImageUrl]: this.parent.img,
        [constants.htmlDataTokenId]: this.parent.parent?.token?.id,
      }),
    });
    const boost = settings.useBoost.get() && this.boost ? 1 : 0;
    const pool = this.pool - (Number(spend) || 0) + boost;
    await this.parent.update({ system: { pool } });
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
    if (this.parent.parent === null) {
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
    if (cost > this.pool) {
      ui.notifications?.error(
        `Attempted to ${reRoll ? `re-roll a ${reRoll} with` : "roll"} ${
          this.parent.name
        } with a levy of ${boonLevy} but pool is currently at ${this.pool}`,
      );
      return;
    }
    const newPool = Math.max(0, this.pool - cost);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.parent.actor as Actor.Stored,
      }),
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: this.parent.id,
        [constants.htmlDataActorId]: this.parent.parent?.id,
        [constants.htmlDataMode]: constants.htmlDataModeMwTest,
        [constants.htmlDataMwDifficulty]: difficulty,
        [constants.htmlDataMwBoonLevy]: boonLevy,
        [constants.htmlDataMwReRoll]: reRoll,
        [constants.htmlDataMwPool]: newPool,
        [constants.htmlDataTokenId]: this.parent.parent?.token?.id,
      }),
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  async mWNegateIllustrious(): Promise<void> {
    const newPool = Math.max(0, this.pool - constants.mwNegateCost);
    await ChatMessage.create({
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: this.parent.id,
        [constants.htmlDataActorId]: this.parent.parent?.id,
        [constants.htmlDataMode]: constants.htmlDataModeMwNegate,
        [constants.htmlDataMwPool]: newPool,
      }),
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  async mWWallop(): Promise<void> {
    const newPool = Math.max(0, this.pool - constants.mwWallopCost);
    await ChatMessage.create({
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: this.parent.id,
        [constants.htmlDataActorId]: this.parent.parent?.id,
        [constants.htmlDataMode]: constants.htmlDataModeMwWallop,
        [constants.htmlDataMwPool]: newPool,
      }),
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  /** The owning PC's system, if there is one (adaptations are on PCs) */
  private getPCSystem(): PCModel | null {
    const actor = this.parent.actor;
    // by type rather than isPCActor: pc.ts imports this file
    return actor?.type === constants.pc ? (actor.system as PCModel) : null;
  }

  /**
   * The owner's Stability state, if this is their Stability ability and
   * states are in use
   */
  getStabilityState(): StabilityState | null {
    const system = this.getPCSystem();
    return system?.getStabilityAbility()?.id === this.parent.id
      ? system.getStabilityState()
      : null;
  }

  /** The owner's Stability state, if states are in use (for any ability) */
  getOwnerStabilityState(): StabilityState | null {
    return this.getPCSystem()?.getStabilityState() ?? null;
  }

  /**
   * The cap on the rating (from adaptations, or Sanity's cap), if there is
   * one
   */
  getRatingCap(): number | null {
    return this.getPCSystem()?.getRatingCap(this.parent.name ?? "") ?? null;
  }

  /** What caps the rating, to say so */
  getRatingCapReasons(): string[] {
    return (
      this.getPCSystem()
        ?.getRatingCaps(this.parent.name ?? "")
        .map(({ reason }) => reason) ?? []
    );
  }

  /**
   * reset the pool to the rating (short by any refresh penalty, e.g. when
   * Adapted to Helplessness)
   */
  async refreshPool(): Promise<void> {
    await this.parent.update({
      system: {
        pool: getRefreshedPool({
          pool: this.pool,
          rating: this.rating ?? 0,
          refreshPenalty:
            this.getPCSystem()?.getAdaptationEffects().refreshPenalty ?? 0,
        }),
      },
    });
  }

  setCategoryId = async (categoryId: string): Promise<void> => {
    const updateData = {
      categoryId,
      fields: {},
    };
    await this.parent.update({ system: updateData });
  };

  setMin = async (min: number): Promise<void> => {
    await this.parent.update({ system: { min } });
  };

  setMax = async (max: number): Promise<void> => {
    await this.parent.update({ system: { max } });
  };

  setOccupational = async (occupational: boolean): Promise<void> => {
    await this.parent.update({ system: { occupational } });
  };

  setShowTracker = async (showTracker: boolean): Promise<void> => {
    await this.parent.update({ system: { showTracker } });
  };

  setExcludeFromGeneralRefresh = async (
    excludeFromGeneralRefresh: boolean,
  ): Promise<void> => {
    await this.parent.update({ system: { excludeFromGeneralRefresh } });
  };

  setRefreshesDaily = async (refreshesDaily: boolean): Promise<void> => {
    await this.parent.update({ system: { refreshesDaily } });
  };

  getSpecialities = (): string[] => {
    return resizeSpecialities(this.specialities, {
      hasSpecialities: this.hasSpecialities,
      rating: this.rating,
      specialitiesMode: this.specialitiesMode,
    });
  };

  getSpecialitesCount = (): number => {
    return getSpecialitiesCount({
      hasSpecialities: this.hasSpecialities,
      rating: this.rating,
      specialitiesMode: this.specialitiesMode,
    });
  };

  setSpecialities = async (newSpecs: string[]): Promise<void> => {
    await this.parent.update({
      system: {
        specialities: resizeSpecialities(newSpecs, {
          hasSpecialities: this.hasSpecialities,
          rating: this.rating,
          specialitiesMode: this.specialitiesMode,
        }),
      },
    });
  };

  setRating = async (rating: number): Promise<void> => {
    const newRating = getCappedRating(rating, this.getRatingCap());
    await this.parent.update({
      system: {
        rating: newRating,
        specialities: resizeSpecialities(this.specialities, {
          hasSpecialities: this.hasSpecialities,
          rating: newRating,
          specialitiesMode: this.specialitiesMode,
        }),
      },
    });
  };

  setRatingAndRefreshPool = async (rating: number): Promise<void> => {
    const newRating = getCappedRating(rating, this.getRatingCap());
    await this.parent.update({
      system: {
        rating: newRating,
        pool: newRating,
        specialities: resizeSpecialities(this.specialities, {
          hasSpecialities: this.hasSpecialities,
          rating: newRating,
          specialitiesMode: this.specialitiesMode,
        }),
      },
    });
  };

  setHasSpecialities = async (hasSpecialities: boolean): Promise<void> => {
    await this.parent.update({
      system: {
        hasSpecialities,
      },
    });
  };

  setNotes = async (newNotes: string): Promise<void> => {
    await this.parent.update({ system: { notes: newNotes } });
  };

  setPool = (pool: number) => {
    return this.parent.update({ system: { pool } });
  };

  setBoost = (boost: boolean) => {
    return this.parent.update({ system: { boost } });
  };

  setHideIfZeroRated = async (hideIfZeroRated: boolean): Promise<void> => {
    await this.parent.update({ system: { hideIfZeroRated } });
  };

  getActiveUnlocks = (): Unlock[] => {
    return this.unlocks.filter(({ rating: targetRating, description }) => {
      return this.rating >= targetRating && description !== "";
    });
  };

  getVisibleSituationalModifiers = (): SituationalModifier[] => {
    return this.situationalModifiers.filter(({ situation }) => {
      return situation !== "";
    });
  };

  toggleSituationalModifier = (id: string): void => {
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
    void this.parent.sheet?.render();
    void this.parent.parent?.sheet?.render();
  };

  isSituationalModifierActive = (id: string): boolean => {
    return this.activeSituationalModifiers.includes(id);
  };

  setUnlockDescription = async (
    index: number,
    description: string,
  ): Promise<void> => {
    const unlocks = [...this.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      description,
    };
    await this.parent.update({ system: { unlocks } });
  };

  setUnlockRating = async (index: number, rating: number): Promise<void> => {
    const unlocks = [...this.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      rating,
    };
    await this.parent.update({ system: { unlocks } });
  };

  deleteUnlock = async (index: number): Promise<void> => {
    const unlocks = [...this.unlocks];
    unlocks.splice(index, 1);
    await this.parent.update({ system: { unlocks } });
  };

  addUnlock = async () => {
    const unlocks: Unlock[] = [
      ...this.unlocks,
      {
        description: "",
        rating: 0,
        id: nanoid(),
      },
    ];
    await this.parent.update({ system: { unlocks } });
  };

  setSituationalModifierSituation = async (
    index: number,
    situation: string,
  ) => {
    const situationalModifiers = [...this.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      situation,
    };
    await this.parent.update({ system: { situationalModifiers } });
  };

  setSituationalModifierModifier = async (
    index: number,
    modifier: number,
  ): Promise<void> => {
    const situationalModifiers = [...this.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      modifier,
    };
    await this.parent.update({ system: { situationalModifiers } });
  };

  deleteSituationalModifier = async (index: number): Promise<void> => {
    const situationalModifiers = [...this.situationalModifiers];
    situationalModifiers.splice(index, 1);
    await this.parent.update({ system: { situationalModifiers } });
  };

  addSituationalModifier = async (): Promise<void> => {
    const situationalModifiers: SituationalModifier[] = [
      ...this.situationalModifiers,
      {
        situation: "",
        modifier: 0,
        id: nanoid(),
      },
    ];
    await this.parent.update({ system: { situationalModifiers } });
  };

  setSpecialitiesMode = async (mode: SpecialitiesMode): Promise<void> => {
    await this.parent.update({ system: { specialitiesMode: mode } });
  };

  setAllowPoolToExceedRating = async (
    allowPoolToExceedRating: boolean,
  ): Promise<void> => {
    await this.parent.update({ system: { allowPoolToExceedRating } });
  };
}
