import type { TraumaType } from "@lumphammer/investigator-fvtt-types";

import type { CardsAreaSettings } from "../../components/cards/types";
import * as c from "../../constants";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { maybeNotesObjectToString } from "../../functions/maybeNotesObjectToString";
import { migrateValue } from "../../functions/migrateValue";
import type { SourceData } from "../../fvtt-exports";
import {
  ArrayField,
  NumberField,
  SchemaField,
  StringField,
  TypedObjectField,
} from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import type { AbilityType, MwRefreshGroup, MwType } from "../../types";
import type { AdaptationEffects } from "../bonds/adaptation";
import {
  adaptationThreshold,
  adaptedRatingCap,
  getAdaptationEffects,
  getAdaptedTypes,
  getBondCap,
  getRefreshedPool,
  isAdapted,
} from "../bonds/adaptation";
import {
  bondPointsPerBurnedStability,
  canBurnBond,
  clampBondPoints,
  compareBonds,
  isBondBroken,
} from "../bonds/rules";
import type { BondItem } from "../items/bond";
import { isBondItem } from "../items/bond";
import type { CardItem } from "../items/card";
import { isCardItem } from "../items/card";
import type { AbilityItem } from "../items/exports";
import { isAbilityItem } from "../items/exports";
import type { GeneralAbilityItem } from "../items/generalAbility";
import { isGeneralAbilityItem } from "../items/generalAbility";
import type { InvestigativeAbilityItem } from "../items/investigativeAbility";
import { isInvestigativeAbilityItem } from "../items/investigativeAbility";
import { assertMwItem, isMwItem } from "../items/mwItem";
import type { NetworkContactItem } from "../items/networkContact";
import { isNetworkContactItem } from "../items/networkContact";
import { getNetworkRefreshPool } from "../contacts/rules";
import type { PersonalDetailItem } from "../items/personalDetail";
import { getSanityCap } from "../sanity/rules";
import {
  getAdaptableTraumaTypes,
  getStabilityThresholds,
  isSanityOn,
} from "../stability/settings";
import type { StabilityState } from "../stability/states";
import { getStabilityState } from "../stability/states";
import { isPersonalDetailItem } from "../items/personalDetail";
import { resizeSpecialities } from "../items/resizeSpecialities";
import { createActiveCharacterSchema } from "../schemaFields";
import { ActiveCharacterModel } from "./ActiveCharacterModel";
import { InvestigatorActor } from "./InvestigatorActor";

/** Ask before adapting: say what it caps */
function getAdaptationConfirmMessage(
  actorName: string,
  type: TraumaType,
): string {
  const names = type.cappedAbilities;
  return [
    getTranslated("MakeActorNameAdaptedToTrauma", {
      ActorName: actorName,
      Trauma: type.name,
    }),
    names.length > 0 &&
      getTranslated("AdaptationCapsAbilitiesConfirm", {
        AbilityNames: new Intl.ListFormat(game.i18n?.lang).format(names),
        RatingCap: String(adaptedRatingCap),
      }),
    type.capsBonds &&
      getTranslated("AdaptationCapsBondsConfirm", {
        BondCap: String(getBondCap(true)),
      }),
    getTranslated("ThisCantBeUndone"),
  ]
    .filter((part) => typeof part === "string")
    .join(" ");
}

const adaptationProgressField = () =>
  new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    max: adaptationThreshold,
    initial: 0,
  });

export const pcSchema = {
  ...createActiveCharacterSchema(),
  /**
   * Progress towards adapting to each trauma type, by its id (Fall of DELTA
   * GREEN, p. 120), as boxes ticked: all of them means adapted. Missing is 0.
   */
  adaptations: new TypedObjectField(adaptationProgressField(), {
    initial: () => ({}),
  }),
  /**
   * Sanity rating lost to shocks this operation (Fall of DELTA GREEN,
   * p. 121): only the worst counts. Full Refresh clears it.
   */
  shockSanityLoss: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 0,
  }),
  buildPoints: new NumberField({
    nullable: false,
    required: true,
    initial: 28,
    min: 0,
  }),
  cardsAreaSettings: new SchemaField({
    category: new StringField({
      nullable: false,
      required: true,
      initial: "all",
      choices: ["all", "categorized"],
    }),
    columnWidth: new StringField({
      nullable: false,
      required: true,
      initial: "narrow",
      choices: ["narrow", "wide", "full"],
    }),
    sortOrder: new StringField({
      nullable: false,
      required: true,
      initial: "newest",
      choices: ["atoz", "ztoa", "newest", "oldest"],
    }),
    viewMode: new StringField({
      nullable: false,
      required: true,
      initial: "short",
      choices: ["short", "full"],
    }),
  }),
  hiddenShortNotes: new ArrayField(new StringField(), {
    nullable: false,
    initial: () => [],
    required: true,
  }),

  longNotes: new ArrayField(
    new StringField({ nullable: false, required: true }),
  ),
  sheetTheme: new StringField({
    nullable: true,
    required: true,
    initial: null,
  }),
  shortNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
};

/**
 * System data for a PC
 */
export type PCSystemData = SourceData<typeof pcSchema>;

/**
 * The model for a PC actor
 */
export class PCModel extends ActiveCharacterModel<
  typeof pcSchema,
  InvestigatorActor<"pc">
> {
  static defineSchema(): typeof pcSchema {
    return pcSchema;
  }

  static migrateData(source) {
    // migrate notes to plain strings
    migrateValue(source, "longNotes", (longNotes) =>
      longNotes?.map(maybeNotesObjectToString),
    );

    return super.migrateData(source);
  }

  getSheetThemeName(): string | null {
    return this.sheetTheme || settings.defaultThemeName.get();
  }

  confirm24hRefresh = async (): Promise<void> => {
    const yes = await confirmADoodleDo({
      message:
        "Refresh all of (actor name)'s abilities which refresh every 24h?",
      confirmText: "Refresh",
      cancelText: "Cancel",
      confirmIconClass: "fa-sync",
      values: { ActorName: this.parent.name ?? "" },
      resolveFalseOnCancel: true,
    });
    if (yes) {
      await this.refresh24h();
    }
  };

  confirmMwRefresh(group: MwRefreshGroup) {
    return async (): Promise<void> => {
      const yes = await confirmADoodleDo({
        message:
          "Refresh all of {ActorName}'s abilities which refresh every {Hours} Hours?",
        confirmText: "Refresh",
        cancelText: "Cancel",
        confirmIconClass: "fa-sync",
        values: { ActorName: this.parent.name ?? "", Hours: group.toString() },
      });
      if (yes) {
        await this.mWrefresh(group);
      }
    };
  }

  confirmMw2Refresh = this.confirmMwRefresh(2);
  confirmMw4Refresh = this.confirmMwRefresh(4);
  confirmMw8Refresh = this.confirmMwRefresh(8);

  async mWrefresh(group: MwRefreshGroup): Promise<void> {
    const updates = Array.from(this.parent.items).flatMap((item) => {
      if (
        isGeneralAbilityItem(item) &&
        // MW refreshes allow you to keep a boon
        item.system.rating > item.system.pool &&
        item.system.mwRefreshGroup === group
      ) {
        return [
          {
            _id: item.id,
            system: {
              pool: item.system.rating,
            },
          },
        ];
      } else {
        return [];
      }
    });
    if (this.shouldBroadcastRefreshes()) {
      await this.broadcastUserMessage(
        "RefreshedAllOfActorNamesHoursHoursRefreshAbilities",
        {
          Hours: group.toString(),
        },
      );
    }
    await this.parent.updateEmbeddedDocuments("Item", updates);
  }

  // if we end up with even more types of refresh it may be worth factoring out
  // the actual refresh code but until then - rule of three
  refresh24h = async (): Promise<void> => {
    const { refreshPenalty } = this.getAdaptationEffects();
    const updates = Array.from(this.parent.items).flatMap((item) => {
      if (!isAbilityItem(item) || !item.system.refreshesDaily) {
        return [];
      }
      const pool = getRefreshedPool({
        pool: item.system.pool,
        rating: item.system.getRefreshTarget(),
        refreshPenalty,
      });
      return pool === item.system.pool
        ? []
        : [{ _id: item.id, system: { pool } }];
    });
    if (this.shouldBroadcastRefreshes()) {
      await this.broadcastUserMessage(
        "RefreshedAllOfActorNames24hRefreshAbilities",
      );
    }
    await this.parent.updateEmbeddedDocuments("Item", updates);
  };

  confirmNuke = async (): Promise<void> => {
    const yes = await confirmADoodleDo({
      message: "NukeAllOfActorNamesAbilitiesAndEquipment",
      confirmText: "Nuke it from orbit",
      cancelText: "Whoops no!",
      confirmIconClass: "fa-radiation",
      resolveFalseOnCancel: true,
      values: { ActorName: this.parent.name ?? "" },
    });
    if (yes) {
      await this.nuke();
    }
  };

  nuke = async (): Promise<void> => {
    await this.parent.deleteEmbeddedDocuments(
      "Item",
      this.parent.items.map((i) => i.id).filter((i) => i !== null),
    );
    ui.notifications?.info(`Nuked ${this.parent.name}.`);
  };

  // XXX type does not need to be optional
  getAbilityByName(name: string, type?: AbilityType): AbilityItem | undefined {
    return this.parent.items.find(
      (item) =>
        isAbilityItem(item) &&
        (type ? item.type === type : true) &&
        item.name === name,
    ) as AbilityItem | undefined;
  }

  // getAbilities(): InvestigatorItem[] {
  //   return this.parent.items.filter(isAbilityItem);
  // }

  // getGeneralAbilities(): InvestigatorItem[] {
  //   return this.getAbilities().filter(isGeneralAbilityItem);
  // }

  // getGeneralAbilityNames(): string[] {
  //   return this.getGeneralAbilities()
  //     .map((a) => a.name)
  //     .filter((n): n is string => n !== null);
  // }

  /** Progress towards adapting to a trauma type */
  getAdaptationProgress(traumaTypeId: string): number {
    return this.adaptations[traumaTypeId] ?? 0;
  }

  /** Adapted to this trauma type? (Never, if it can't be adapted to.) */
  isAdaptedTo(traumaTypeId: string): boolean {
    return getAdaptableTraumaTypes().some(
      (type) =>
        type.id === traumaTypeId &&
        isAdapted(this.getAdaptationProgress(traumaTypeId)),
    );
  }

  /** The names of the trauma types the character has adapted to */
  getAdaptedTraumaNames(
    filter: (type: TraumaType) => boolean = () => true,
  ): string[] {
    return getAdaptedTypes(getAdaptableTraumaTypes(), this.adaptations)
      .filter(filter)
      .map((type) => type.name);
  }

  /** What everything the character has adapted to does, together */
  getAdaptationEffects(): AdaptationEffects {
    return getAdaptationEffects(getAdaptableTraumaTypes(), this.adaptations);
  }

  /** The highest a Bond can be raised to: 2 when adapted to something */
  getBondCap(): number {
    return getBondCap(this.getAdaptationEffects().capsBonds);
  }

  /**
   * The caps on an ability's rating, with what each comes from (to say so):
   * adaptations, and Sanity's cap
   */
  getRatingCaps(abilityName: string): { cap: number; reason: string }[] {
    const caps: { cap: number; reason: string }[] = [];
    const adaptedTo = this.getAdaptedTraumaNames(({ cappedAbilities }) =>
      cappedAbilities.includes(abilityName),
    );
    if (adaptedTo.length > 0) {
      caps.push({
        cap: adaptedRatingCap,
        reason: getTranslated("AdaptedToTrauma", {
          Trauma: new Intl.ListFormat(game.i18n?.lang).format(adaptedTo),
        }),
      });
    }
    const sanityCap =
      abilityName === settings.sanityAbility.get() ? this.getSanityCap() : null;
    if (sanityCap !== null) {
      caps.push({
        cap: sanityCap,
        reason: getTranslated("SanityCapReason", {
          Base: String(settings.sanityCapBase.get()),
          AbilityName: settings.sanityCapAbility.get(),
        }),
      });
    }
    return caps;
  }

  /** The cap on an ability's rating, if any: the lowest of its caps */
  getRatingCap(abilityName: string): number | null {
    const caps = this.getRatingCaps(abilityName).map(({ cap }) => cap);
    return caps.length > 0 ? Math.min(...caps) : null;
  }

  /** The ability whose rating comes off Sanity's cap, e.g. Cthulhu Mythos */
  getSanityCapAbility(): AbilityItem | undefined {
    const name = settings.sanityCapAbility.get();
    return this.parent.items.find(
      (item): item is AbilityItem & Item.Stored =>
        isAbilityItem(item) && item.name === name,
    );
  }

  /** The highest Sanity's rating can go, or null if Sanity rules are off */
  getSanityCap(): number | null {
    if (!isSanityOn()) {
      return null;
    }
    return getSanityCap({
      base: settings.sanityCapBase.get(),
      capAbilityRating: this.getSanityCapAbility()?.system.rating ?? 0,
    });
  }

  /**
   * Tick or clear progress towards an adaptation. Becoming adapted can cap
   * ratings and Bonds, which there's no undoing, so ask first.
   */
  setAdaptationProgress = async (
    traumaTypeId: string,
    progress: number,
  ): Promise<void> => {
    const type = getAdaptableTraumaTypes().find(
      ({ id }) => id === traumaTypeId,
    );
    const becomingAdapted =
      type !== undefined &&
      isAdapted(progress) &&
      !this.isAdaptedTo(traumaTypeId);
    const capsSomething =
      type !== undefined && (type.cappedAbilities.length > 0 || type.capsBonds);
    if (becomingAdapted && capsSomething) {
      const yes = await confirmADoodleDo({
        message: getAdaptationConfirmMessage(this.parent.name ?? "", type),
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmIconClass: "fa-check",
        resolveFalseOnCancel: true,
        translate: false,
      });
      if (!yes) {
        return;
      }
    }
    await this.parent.update({
      system: { adaptations: { [traumaTypeId]: progress } },
    });
    if (becomingAdapted) {
      await this.capRatingsForAdaptation(type.cappedAbilities);
    }
  };

  /**
   * Bring capped abilities' ratings down to the cap. Their pools stay as they
   * are, to be spent (p. 050); they just won't refresh above it.
   */
  capRatingsForAdaptation = async (names: string[]): Promise<void> => {
    const cap = adaptedRatingCap;
    const updates = this.getAbilities().flatMap((ability) => {
      if (!names.includes(ability.name ?? "") || ability.system.rating <= cap) {
        return [];
      }
      return [
        {
          _id: ability.id,
          system: {
            rating: cap,
            specialities: resizeSpecialities(ability.system.specialities, {
              hasSpecialities: ability.system.hasSpecialities,
              rating: cap,
              specialitiesMode: ability.system.specialitiesMode,
            }),
          },
        },
      ];
    });
    await this.parent.updateEmbeddedDocuments("Item", updates);
  };

  /** Bonds in display order: ordinary first, then DELTA GREEN, by name */
  getBonds(): BondItem[] {
    return this.parent.items
      .filter((item) => isBondItem(item))
      .toSorted((a, b) =>
        compareBonds(
          { name: a.name ?? "", isDeltaGreen: a.system.isDeltaGreen },
          { name: b.name ?? "", isDeltaGreen: b.system.isDeltaGreen },
        ),
      );
  }

  /**
   * The Agent's Stability state (Fall of DELTA GREEN, p. 113), or null if
   * states aren't in use, or there's no Stability ability
   */
  getStabilityState(): StabilityState | null {
    const thresholds = getStabilityThresholds();
    const stability = this.getStabilityAbility();
    return thresholds && stability
      ? getStabilityState(stability.system.pool, thresholds)
      : null;
  }

  /** The Sanity ability: shocks reduce its rating, which is capped */
  getSanityAbility(): GeneralAbilityItem | undefined {
    const name = settings.sanityAbility.get();
    return this.parent.items.find(
      (item): item is GeneralAbilityItem & Item.Stored<"generalAbility"> =>
        isGeneralAbilityItem(item) && item.name === name,
    );
  }

  /** The end of an operation: shocks can cost Sanity again */
  protected override async afterFullRefresh(): Promise<void> {
    if (this.shockSanityLoss !== 0) {
      await this.parent.update({ system: { shockSanityLoss: 0 } });
    }
  }

  /**
   * The Stability ability: Bonds are spent on it and burned for it, and
   * trauma tests are made with it
   */
  getStabilityAbility(): GeneralAbilityItem | undefined {
    const name = settings.stabilityAbility.get();
    return this.parent.items.find(
      (item): item is GeneralAbilityItem & Item.Stored<"generalAbility"> =>
        isGeneralAbilityItem(item) && item.name === name,
    );
  }

  canBurnBond(bond: BondItem): boolean {
    const stability = this.getStabilityAbility();
    return (
      stability !== undefined &&
      canBurnBond({
        bondPoints: bond.system.points,
        stabilityPool: stability.system.pool,
        stabilityRating: stability.system.rating,
      })
    );
  }

  /**
   * Abilities whose points can go on the test to rebuild a Bond (p. 128):
   * Interpersonal ones by default, that the character has. Some may have no
   * points left.
   */
  getRebuildSpendAbilities(): InvestigativeAbilityItem[] {
    const category = settings.bondRebuildSpendCategory.get();
    return this.parent.items
      .filter(
        (
          item,
        ): item is InvestigativeAbilityItem &
          Item.Stored<"investigativeAbility"> =>
          isInvestigativeAbilityItem(item) &&
          item.system.categoryId === category &&
          item.system.rating >= 1,
      )
      .toSorted((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }

  /**
   * Only ordinary Bonds can be rebuilt this way (DELTA GREEN Bonds have their
   * own rules, p. 046), and a broken Bond is gone for good.
   */
  canRebuildBond(bond: BondItem): boolean {
    return (
      !bond.system.isDeltaGreen &&
      !bond.system.isBroken &&
      this.getStabilityAbility() !== undefined
    );
  }

  /**
   * Bonds that can be neglected for a new one (p. 129): ordinary ones that
   * aren't broken.
   */
  getNeglectableBonds(): BondItem[] {
    return this.getBonds().filter(
      (bond) => !bond.system.isDeltaGreen && !bond.system.isBroken,
    );
  }

  /**
   * Broken Bonds which a new Bond can re-form (p. 046: "rebuild it from
   * scratch"). DELTA GREEN Bonds form their own way.
   */
  getReformableBonds(): BondItem[] {
    return this.getBonds().filter(
      (bond) => !bond.system.isDeltaGreen && bond.system.isBroken,
    );
  }

  /** Ask first: burning permanently damages the Bond */
  confirmBurnBond = async (bond: BondItem): Promise<void> => {
    const stability = this.getStabilityAbility();
    if (stability === undefined || !this.canBurnBond(bond)) {
      // burnBond explains why not
      await this.burnBond(bond);
      return;
    }
    const bondPointsAfter = clampBondPoints(
      bond.system.points - bondPointsPerBurnedStability,
    );
    const yes = await confirmADoodleDo({
      message: isBondBroken(bondPointsAfter)
        ? "BurnBondConfirmBreaks"
        : "BurnBondConfirm",
      confirmText: "Burn",
      cancelText: "Cancel",
      confirmIconClass: "fa-fire",
      resolveFalseOnCancel: true,
      values: {
        BondName: bond.name ?? "",
        Points: String(bondPointsPerBurnedStability),
        BondPoints: String(bond.system.points),
        BondPointsAfter: String(bondPointsAfter),
        AbilityName: stability.name ?? "",
        Pool: String(stability.system.pool),
        PoolAfter: String(stability.system.pool + 1),
      },
    });
    if (yes) {
      await this.burnBond(bond);
    }
  };

  /**
   * Burn a Bond (Fall of DELTA GREEN, p. 120): spend 2 of its points to
   * restore 1 Stability point.
   */
  burnBond = async (bond: BondItem): Promise<void> => {
    const stability = this.getStabilityAbility();
    if (stability === undefined) {
      ui.notifications?.warn(
        getTranslated("NoAbilityToBurnBondsFor", {
          AbilityName: settings.stabilityAbility.get(),
        }),
      );
      return;
    }
    if (!this.canBurnBond(bond)) {
      return;
    }
    await this.parent.updateEmbeddedDocuments("Item", [
      {
        _id: bond.id,
        system: {
          points: clampBondPoints(
            bond.system.points - bondPointsPerBurnedStability,
          ),
        },
      },
      { _id: stability.id, system: { pool: stability.system.pool + 1 } },
    ]);
    await this.broadcastUserMessage("ActorNameBurnedBondNameForAbilityName", {
      BondName: bond.name ?? "",
      AbilityName: stability.name ?? "",
      Points: String(bondPointsPerBurnedStability),
    });
  };

  createBond = async (): Promise<void> => {
    await this.parent.createEmbeddedDocuments(
      "Item",
      [{ type: c.bond, name: "New Bond" }],
      { renderSheet: true },
    );
  };

  /** The Network ability, which contacts' points come from */
  getNetworkAbility(): GeneralAbilityItem | undefined {
    const name = settings.networkAbility.get();
    return this.parent.items.find(
      (item): item is GeneralAbilityItem & Item.Stored<"generalAbility"> =>
        isGeneralAbilityItem(item) && item.name === name,
    );
  }

  /** Network contacts (Fall of DELTA GREEN, p. 068), by name */
  getNetworkContacts(): NetworkContactItem[] {
    return this.parent.items
      .filter((item) => isNetworkContactItem(item))
      .toSorted((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }

  /** The Network points contacts still hold */
  getContactPoints(): number {
    return this.getNetworkContacts().reduce(
      (total, contact) => total + contact.system.pool,
      0,
    );
  }

  /**
   * What an ability refreshes to: its rating, except that Network leaves out
   * what contacts still hold, so its pool and theirs add up to its rating
   */
  getRefreshTarget(ability: AbilityItem): number {
    const rating = ability.system.rating;
    if (
      !settings.useNetworkContacts.get() ||
      ability.id !== this.getNetworkAbility()?.id
    ) {
      return rating;
    }
    return getNetworkRefreshPool({
      rating,
      contactPools: this.getNetworkContacts().map(
        (contact) => contact.system.pool,
      ),
    });
  }

  createNetworkContact = async (): Promise<void> => {
    await this.parent.createEmbeddedDocuments(
      "Item",
      [{ type: c.networkContact, name: getTranslated("New contact") }],
      { renderSheet: true },
    );
  };

  getPersonalDetails(): PersonalDetailItem[] {
    return this.parent.items.filter((item) => isPersonalDetailItem(item));
  }

  getMwItems(): { [type in MwType]: Item[] } {
    const allItems = this.parent.items.filter(isMwItem);
    const items: { [type in MwType]: Item[] } = {
      tweak: [],
      spell: [],
      cantrap: [],
      enchantedItem: [],
      meleeWeapon: [],
      missileWeapon: [],
      manse: [],
      retainer: [],
      sandestin: [],
    };
    for (const item of allItems) {
      assertMwItem(item);
      items[item.system.mwType].push(item);
    }
    return items;
  }

  getOccupations = (): PersonalDetailItem[] => {
    return this.getPersonalDetailsInSlotIndex(c.occupationSlotIndex);
  };

  getPersonalDetailsInSlotIndex = (slotIndex: number): PersonalDetailItem[] => {
    const personalDetailItems = this.getPersonalDetails().filter((item) => {
      return item.system.slotIndex === slotIndex;
    });
    return personalDetailItems;
  };

  setSheetTheme = async (sheetTheme: string | null): Promise<void> => {
    await this.parent.update({ system: { sheetTheme } });
  };

  getLongNote = (i: number) => {
    return this.longNotes?.[i] ?? "";
  };

  setLongNote = (i: number, note: string) => {
    const longNotes = [...(this.longNotes || [])];
    longNotes[i] = note;
    return this.parent.update({ system: { longNotes } });
  };

  getShortNote = (i: number): string => {
    return this.shortNotes?.[i] ?? "";
  };

  setShortNote = (i: number, text: string) => {
    const newNotes = [...(this.shortNotes || [])];
    newNotes[i] = text;
    return this.parent.update({
      system: {
        shortNotes: newNotes,
      },
    });
  };

  setMwHiddenShortNote = (i: number, text: string) => {
    const newNotes = [...(this.hiddenShortNotes || [])];
    newNotes[i] = text;
    return this.parent.update({
      system: {
        hiddenShortNotes: newNotes,
      },
    });
  };

  // ###########################################################################
  // Moribund World stuff

  createEquipment = async (categoryId: string): Promise<void> => {
    await this.parent.createEmbeddedDocuments(
      "Item",
      [
        {
          type: c.equipment,
          name: "New item",
          system: {
            categoryId,
          },
        },
      ],
      {
        renderSheet: true,
      },
    );
  };

  createCard = async (): Promise<void> => {
    await this.parent.createEmbeddedDocuments(
      "Item",
      [
        {
          type: c.card,
          name: "New card",
        },
      ],
      {
        renderSheet: true,
      },
    );
  };

  setCardsAreaSettings = async (
    cardsAreaSettings: CardsAreaSettings,
  ): Promise<void> => {
    await this.parent.update({ system: { cardsAreaSettings } });
  };

  getNonContinuityCards = (): CardItem[] => {
    return this.parent.items.filter(
      (item): item is CardItem & Item.Stored<"card"> =>
        isCardItem(item) && !item.system.continuity,
    );
  };

  endScenario = async (): Promise<void> => {
    const nonContinuityCards = this.getNonContinuityCards();
    const ids = nonContinuityCards
      .map((c) => c.id)
      .filter((id): id is string => id !== null);
    await this.parent.deleteEmbeddedDocuments("Item", ids);
  };

  createPersonalDetail = async (
    slotIndex: number,
    renderSheet = true,
  ): Promise<void> => {
    const name =
      slotIndex === c.occupationSlotIndex
        ? settings.genericOccupation.get()
        : `New ${settings.personalDetails.get()[slotIndex]?.name ?? "detail"}`;
    await this.parent.createEmbeddedDocuments(
      "Item",
      [
        {
          type: c.personalDetail,
          name,
          system: {
            slotIndex,
          },
        },
      ],
      {
        renderSheet,
      },
    );
  };
}

export type PCActor = InvestigatorActor<typeof c.pc>;

export function isPCActor(x: unknown): x is PCActor {
  return x instanceof InvestigatorActor && x.type === c.pc;
}

export function assertPCActor(x: unknown): asserts x is PCActor {
  if (!isPCActor(x)) {
    throw new Error("Expected a PC actor");
  }
}
