import { nanoid } from "nanoid";

import * as constants from "../../constants";
import { fixLength } from "../../functions/utilities";
import { TypeDataModel } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import {
  MWDifficulty,
  NoteWithFormat,
  SituationalModifier,
  SpecialitiesMode,
  Unlock,
} from "../../types";
import { AbilitySchema } from "./createAbilitySchema";
import { InvestigatorItem } from "./InvestigatorItem";

/**
 * AbilityModel
 */
export abstract class AbilityModel<
  TSchema extends AbilitySchema,
  TParent extends InvestigatorItem,
> extends TypeDataModel<TSchema, TParent> {
  /**
   * The situational modifiers that are currently active
   */
  activeSituationalModifiers: string[] = [];

  /**
   * classic gumshoe test: spend a number of points from the pool, and add that
   * to a d6
   */
  async testAbility(spend: number): Promise<void> {
    if (this.parent.parent === null) {
      return;
    }
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
        actor: this.parent.parent,
      }),
      content: `
          <div
            class="${constants.abilityChatMessageClassName}"
            ${constants.htmlDataItemId}="${this.parent.id}"
            ${constants.htmlDataActorId}="${this.parent.parent?.id ?? ""}"
            ${constants.htmlDataMode}="${constants.htmlDataModeTest}"
            ${constants.htmlDataName}="${this.parent.name}"
            ${constants.htmlDataImageUrl}="${this.parent.img}"
            ${constants.htmlDataTokenId}="${this.parent.parent?.token?.id ?? ""}"
          />
        `,
    });
    const pool = this.pool - (Number(spend) || 0);
    await this.parent.update({ system: { pool } });
  }

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
        actor: this.parent.parent,
      }),
      content: `
          <div
            class="${constants.abilityChatMessageClassName}"
            ${constants.htmlDataItemId}="${this.parent.id}"
            ${constants.htmlDataActorId}="${this.parent.parent?.id ?? ""}"
            ${constants.htmlDataMode}="${constants.htmlDataModeSpend}"
            ${constants.htmlDataName}="${this.parent.name}"
            ${constants.htmlDataImageUrl}="${this.parent.img}"
            ${constants.htmlDataTokenId}="${this.parent.parent?.token?.id ?? ""}"
          />
        `,
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
        actor: this.parent.parent,
      }),
      content: `
          <div
            class="${constants.abilityChatMessageClassName}"
            ${constants.htmlDataItemId}="${this.parent.id}"
            ${constants.htmlDataActorId}="${this.parent.parent?.id ?? ""}"
            ${constants.htmlDataMode}="${constants.htmlDataModeMwTest}"
            ${constants.htmlDataMwDifficulty} = ${difficulty}
            ${constants.htmlDataMwBoonLevy} = ${boonLevy}
            ${constants.htmlDataMwReRoll} = ${reRoll === null ? '""' : reRoll}
            ${constants.htmlDataMwPool} = ${newPool}
            ${constants.htmlDataTokenId}="${this.parent.parent?.token?.id ?? ""}"
          />
        `,
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  async mWNegateIllustrious(): Promise<void> {
    const newPool = Math.max(0, this.pool - constants.mwNegateCost);
    await ChatMessage.create({
      content: `
          <div
            class="${constants.abilityChatMessageClassName}"
            ${constants.htmlDataItemId}="${this.parent.id}"
            ${constants.htmlDataActorId}="${this.parent.parent?.id ?? ""}"
            ${constants.htmlDataMode}="${constants.htmlDataModeMwNegate}"
            ${constants.htmlDataMwPool} = ${newPool}
          />
        `,
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  async mWWallop(): Promise<void> {
    const newPool = Math.max(0, this.pool - constants.mwWallopCost);
    await ChatMessage.create({
      content: `
          <div
            class="${constants.abilityChatMessageClassName}"
            ${constants.htmlDataItemId}="${this.parent.id}"
            ${constants.htmlDataActorId}="${this.parent.parent?.id ?? ""}"
            ${constants.htmlDataMode}="${constants.htmlDataModeMwWallop}"
            ${constants.htmlDataMwPool} = ${newPool}
          />
        `,
    });
    await this.parent.update({ system: { pool: newPool } });
  }

  /**
   * reset the pool to the rating
   */
  async refreshPool(): Promise<void> {
    await this.parent.update({
      system: {
        pool: this.rating ?? 0,
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
    return fixLength(this.specialities, this.getSpecialitesCount(), "");
  };

  getSpecialitesCount = (): number => {
    if (!this.hasSpecialities) {
      return 0;
    } else if (this.specialitiesMode === "twoThreeFour") {
      // NBA langauges style
      switch (this.rating) {
        case 0:
          return 0;
        case 1:
          return 2;
        case 2:
          return 5;
        default:
          return Math.max(0, (this.rating - 2) * 4 + 5);
      }
    } else {
      return this.rating;
    }
  };

  setSpecialities = async (newSpecs: string[]): Promise<void> => {
    await this.parent.update({
      system: {
        specialities: fixLength(newSpecs, this.getSpecialitesCount(), ""),
      },
    });
  };

  setRating = async (newRating: number): Promise<void> => {
    await this.parent.update({
      system: {
        rating: newRating,
        specialities: fixLength(this.specialities, newRating, ""),
      },
    });
  };

  setRatingAndRefreshPool = async (newRating: number): Promise<void> => {
    await this.parent.update({
      system: {
        rating: newRating,
        pool: newRating,
        specialities: fixLength(this.specialities, newRating, ""),
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

  setNotes = async (newNotes: NoteWithFormat): Promise<void> => {
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
