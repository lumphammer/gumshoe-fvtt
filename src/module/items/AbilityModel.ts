import { nanoid } from "nanoid";

import * as constants from "../../constants";
import { assertGame, fixLength } from "../../functions/utilities";
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

// /////////////////////////////////////////////////////////////////////////////
// IMPORTANT NOTE ABOUT TYPE ERRORS
//
// The type signature of this class "should" work, and allow the methods to see
// the members of TSchema as its own members, as with any other use of
// TypeDataModel. Unfortunately the types get too deep and TS refuses to
// reduce the types of the schema parts correctly.
//
// One fix, as per [LukeAbby's suggestion][1], is to add a `this` parameter to
// each method:

// ```
//   async testAbility(this: AbilityModel<AbilitySchema, InvestigatorItem>, spend: number): Promise<void> {
//     ...
//   }
// ```
//
// This effectively un-generices the method. The downside is that it doesn't
// work with function properties, which we us extensively because they can be
// used as event handlers directly. It also creates some `excessively deep`
// errors across the codebase.
//
// For those reasons, I have simply strewn @ts-expect-error across this file.
//
// [1]: https://discord.com/channels/732325252788387980/803646399014109205/1376943254368420043
// /////////////////////////////////////////////////////////////////////////////

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
    assertGame(game);
    if (this.parent.parent === null) {
      return;
    }
    const isBoosted = settings.useBoost.get() && this.boost;
    const boost = isBoosted ? 1 : 0;
    const situationalModifiers = this.activeSituationalModifiers.map((id) => {
      // @ts-expect-error - see comment at top of file
      const situationalModifier = this.situationalModifiers.find(
        // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
    assertGame(game);

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
    // @ts-expect-error - see comment at top of file
    if (cost > this.pool) {
      ui.notifications?.error(
        `Attempted to ${reRoll ? `re-roll a ${reRoll} with` : "roll"} ${
          this.parent.name
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        } with a levy of ${boonLevy} but pool is currently at ${this.pool}`,
      );
      return;
    }
    // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
        // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
          // @ts-expect-error - see comment at top of file
          return Math.max(0, (this.rating - 2) * 4 + 5);
      }
    } else {
      // @ts-expect-error - see comment at top of file
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
        // @ts-expect-error - see comment at top of file
        specialities: fixLength(this.specialities, newRating, ""),
      },
    });
  };

  setRatingAndRefreshPool = async (newRating: number): Promise<void> => {
    await this.parent.update({
      system: {
        rating: newRating,
        pool: newRating,
        // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
    return this.unlocks.filter(({ rating: targetRating, description }) => {
      return this.rating >= targetRating && description !== "";
    });
  };

  getVisibleSituationalModifiers = (): SituationalModifier[] => {
    // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
    const unlocks = [...this.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      description,
    };
    await this.parent.update({ system: { unlocks } });
  };

  setUnlockRating = async (index: number, rating: number): Promise<void> => {
    // @ts-expect-error - see comment at top of file
    const unlocks = [...this.unlocks];
    unlocks[index] = {
      ...unlocks[index],
      rating,
    };
    await this.parent.update({ system: { unlocks } });
  };

  deleteUnlock = async (index: number): Promise<void> => {
    // @ts-expect-error - see comment at top of file
    const unlocks = [...this.unlocks];
    unlocks.splice(index, 1);
    await this.parent.update({ system: { unlocks } });
  };

  addUnlock = async () => {
    const unlocks: Unlock[] = [
      // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
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
    // @ts-expect-error - see comment at top of file
    const situationalModifiers = [...this.situationalModifiers];
    situationalModifiers[index] = {
      ...situationalModifiers[index],
      modifier,
    };
    await this.parent.update({ system: { situationalModifiers } });
  };

  deleteSituationalModifier = async (index: number): Promise<void> => {
    // @ts-expect-error - see comment at top of file
    const situationalModifiers = [...this.situationalModifiers];
    situationalModifiers.splice(index, 1);
    await this.parent.update({ system: { situationalModifiers } });
  };

  addSituationalModifier = async (): Promise<void> => {
    const situationalModifiers: SituationalModifier[] = [
      // @ts-expect-error - see comment at top of file
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
