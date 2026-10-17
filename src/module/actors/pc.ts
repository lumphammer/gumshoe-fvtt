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
} from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import type { AbilityType, MwRefreshGroup, MwType } from "../../types";
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
import { assertMwItem, isMwItem } from "../items/mwItem";
import type { PersonalDetailItem } from "../items/personalDetail";
import { isPersonalDetailItem } from "../items/personalDetail";
import { createActiveCharacterSchema } from "../schemaFields";
import { ActiveCharacterModel } from "./ActiveCharacterModel";
import { InvestigatorActor } from "./InvestigatorActor";

export const pcSchema = {
  ...createActiveCharacterSchema(),
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
    const updates = Array.from(this.parent.items).flatMap((item) => {
      if (
        isAbilityItem(item) &&
        item.system.rating !== item.system.pool &&
        item.system.refreshesDaily
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

  /** The ability Bonds can be spent on and burned for, usually Stability */
  getBondStabilityAbility(): GeneralAbilityItem | undefined {
    const name = settings.bondStabilityAbility.get();
    return this.parent.items.find(
      (item): item is GeneralAbilityItem & Item.Stored<"generalAbility"> =>
        isGeneralAbilityItem(item) && item.name === name,
    );
  }

  canBurnBond(bond: BondItem): boolean {
    const stability = this.getBondStabilityAbility();
    return (
      stability !== undefined &&
      canBurnBond({
        bondPoints: bond.system.points,
        stabilityPool: stability.system.pool,
        stabilityRating: stability.system.rating,
      })
    );
  }

  /** Ask first: burning permanently damages the Bond */
  confirmBurnBond = async (bond: BondItem): Promise<void> => {
    const stability = this.getBondStabilityAbility();
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
    const stability = this.getBondStabilityAbility();
    if (stability === undefined) {
      ui.notifications?.warn(
        getTranslated("NoAbilityToBurnBondsFor", {
          AbilityName: settings.bondStabilityAbility.get(),
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
