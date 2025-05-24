import { CardsAreaSettings } from "../../components/cards/types";
import * as c from "../../constants";
import { occupationSlotIndex } from "../../constants";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { convertNotes } from "../../functions/textFunctions";
import { assertGame } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import {
  AbilityType,
  MwInjuryStatus,
  MwRefreshGroup,
  MwType,
  Resource,
} from "../../types";
import {
  AbilityItem,
  assertMwItem,
  assertPersonalDetailItem,
  CardItem,
  GeneralAbilityItem,
  InvestigativeAbilityItem,
  isAbilityItem,
  isCardItem,
  isEquipmentItem,
  isGeneralAbilityItem,
  isInvestigativeAbilityItem,
  isMwItem,
  isPersonalDetailItem,
  isWeaponItem,
  PersonalDetailItem,
} from "../../v10Types";
import { InvestigatorActor } from "../InvestigatorActor";
import { InvestigatorItem } from "../InvestigatorItem";
import { recordField } from "./shared";

import NumberField = foundry.data.fields.NumberField;
import StringField = foundry.data.fields.StringField;
import ArrayField = foundry.data.fields.ArrayField;
import BooleanField = foundry.data.fields.BooleanField;
import SchemaField = foundry.data.fields.SchemaField;
import SourceData = foundry.data.fields.SchemaField.SourceData;

export const pcSchema = {
  buildPoints: new NumberField({ nullable: false, required: true, min: 0 }),
  /* @deprecated occupation is now a personalDetail item */
  occupation: new StringField({ nullable: false, required: true }),
  longNotes: new ArrayField(
    new SchemaField({
      source: new StringField({ nullable: false, required: true }),
      html: new StringField({ nullable: false, required: true }),
    }),
  ),
  longNotesFormat: new StringField({
    nullable: false,
    required: true,
    choices: ["plain", "richText", "markdown"],
  }),
  shortNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  hiddenShortNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  initiativeAbility: new StringField({ nullable: false, required: true }),
  hideZeroRated: new BooleanField({ nullable: false, required: true }),
  sheetTheme: new StringField({ nullable: false, required: true }),
  /* @deprecated */
  hitThreshold: new NumberField({ nullable: false, required: true, min: 0 }),
  mwInjuryStatus: new StringField({
    nullable: false,
    required: true,
    choices: ["uninjured", "hurt", "down", "unconscious", "dead"],
  }),
  resources: recordField<Record<string, Resource>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  stats: recordField<Record<string, number>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  initiativePassingTurns: new NumberField({ nullable: false, min: 0 }),
  cardsAreaSettings: new SchemaField({
    category: new StringField({
      nullable: false,
      required: true,
      choices: ["all", "categorized"],
    }),
    sortOrder: new StringField({
      nullable: false,
      required: true,
      choices: ["atoz", "ztoa", "newest", "oldest"],
    }),
    viewMode: new StringField({
      nullable: false,
      required: true,
      choices: ["short", "full"],
    }),
    columnWidth: new StringField({
      nullable: false,
      required: true,
      choices: ["narrow", "wide", "full"],
    }),
  }),
};

type BaseNote =
  typeof pcSchema.longNotes.element extends SchemaField<
    infer Schema,
    any,
    any,
    any,
    any
  >
    ? SourceData<Schema>
    : never;

type NoteFormat =
  typeof pcSchema.longNotesFormat extends StringField<
    any,
    any,
    any,
    infer PersistedType
  >
    ? PersistedType
    : never;

export class PCModel extends foundry.abstract.TypeDataModel<
  typeof pcSchema,
  InvestigatorActor<"pc">
> {
  static defineSchema(): typeof pcSchema {
    return pcSchema;
  }

  getSheetThemeName(): string | null {
    return this.sheetTheme || settings.defaultThemeName.get();
  }

  shouldBroadcastRefreshes(): boolean {
    assertGame(game);
    return !game.user.isGM;
  }

  confirmRefresh = async (): Promise<void> => {
    const yes = await confirmADoodleDo({
      message: "Refresh all of (actor name)'s abilities?",
      confirmText: "Refresh",
      cancelText: "Cancel",
      confirmIconClass: "fa-sync",
      values: { ActorName: this.parent.name ?? "" },
    });
    if (yes) {
      await this.refresh();
    }
  };

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

  refresh = async (): Promise<void> => {
    const updates = Array.from(this.parent.items).flatMap((item) => {
      if (
        isAbilityItem(item) &&
        item.system.rating !== item.system.pool &&
        !item.system.excludeFromGeneralRefresh
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
      await this.broadcastUserMessage("RefreshedAllOfActorNamesAbilities");
    }
    await this.parent.updateEmbeddedDocuments("Item", updates);
  };

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

  broadcastUserMessage = async (
    text: string,
    extraData: Record<string, string> = {},
  ): Promise<void> => {
    assertGame(game);
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({
        alias: game.user.name ?? "",
      }),
      content: getTranslated(text, {
        ActorName: this.parent.name ?? "",
        UserName: game.user.name ?? "",
        ...extraData,
      }),
    };
    await ChatMessage.create(chatData, {});
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
        // @ts-expect-error this.type
        (type ? item.type === type : true) &&
        item.name === name,
    ) as AbilityItem | undefined;
  }

  getEquipment(): InvestigatorItem[] {
    return this.parent.items.filter(isEquipmentItem);
  }

  getWeapons(): InvestigatorItem[] {
    return this.parent.items.filter(isWeaponItem);
  }

  getAbilities(): InvestigatorItem[] {
    return this.parent.items.filter(isAbilityItem);
  }

  getGeneralAbilities(): InvestigatorItem[] {
    return this.getAbilities().filter(isGeneralAbilityItem);
  }

  getGeneralAbilityNames(): string[] {
    return this.getGeneralAbilities()
      .map((a) => a.name)
      .filter((n): n is string => n !== null);
  }

  getPersonalDetails(): PersonalDetailItem[] {
    return this.parent.items.filter(isPersonalDetailItem);
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

  getTrackerAbilities(): AbilityItem[] {
    return this.getAbilities().filter(
      (item): item is AbilityItem =>
        isAbilityItem(item) && item.system.showTracker,
    );
  }

  getCategorizedAbilities(
    hideZeroRated: boolean,
    hidePushPool: boolean,
  ): {
    investigativeAbilities: { [category: string]: InvestigativeAbilityItem[] };
    generalAbilities: { [category: string]: GeneralAbilityItem[] };
  } {
    // why is this a hook? what was I thinking 3 years ago? it's lieterally just
    // a function.

    const investigativeAbilities: {
      [category: string]: InvestigativeAbilityItem[];
    } = {};
    const generalAbilities: { [category: string]: GeneralAbilityItem[] } = {};
    const systemInvestigativeCats =
      settings.investigativeAbilityCategories.get();
    const systemGeneralCats = settings.generalAbilityCategories.get();
    for (const cat of systemInvestigativeCats) {
      investigativeAbilities[cat] = [];
    }
    for (const cat of systemGeneralCats) {
      generalAbilities[cat] = [];
    }

    for (const item of this.parent.items.values()) {
      if (!isAbilityItem(item)) {
        continue;
      }
      if (
        hideZeroRated &&
        item.system.hideIfZeroRated &&
        item.system.rating === 0
      ) {
        continue;
      }
      if (isInvestigativeAbilityItem(item)) {
        const cat = item.system.categoryId || "Uncategorised";
        if (investigativeAbilities[cat] === undefined) {
          investigativeAbilities[cat] = [];
        }
        investigativeAbilities[cat].push(item);
      } else if (isGeneralAbilityItem(item)) {
        if (hidePushPool && item.system.isPushPool) {
          continue;
        }
        const cat = item.system.categoryId || "Uncategorised";
        if (generalAbilities[cat] === undefined) {
          generalAbilities[cat] = [];
        }
        generalAbilities[cat].push(item);
      }
    }

    return { investigativeAbilities, generalAbilities };
  }

  getOccupations = (): PersonalDetailItem[] => {
    return this.getPersonalDetailsInSlotIndex(occupationSlotIndex);
  };

  getPersonalDetailsInSlotIndex = (slotIndex: number): PersonalDetailItem[] => {
    const personalDetailItems = this.getPersonalDetails().filter((item) => {
      assertPersonalDetailItem(item);
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

  setLongNote = (i: number, note: BaseNote) => {
    const longNotes = [...(this.longNotes || [])];
    longNotes[i] = note;
    return this.parent.update({ system: { longNotes } });
  };

  setLongNotesFormat = async (longNotesFormat: NoteFormat) => {
    const longNotesPromises = (this.longNotes || []).map<Promise<BaseNote>>(
      async (note) => {
        const { newHtml, newSource } = await convertNotes(
          this.longNotesFormat,
          longNotesFormat,
          note?.source ?? "",
        );
        return {
          html: newHtml,
          source: newSource,
        };
      },
    );
    const longNotes = await Promise.all(longNotesPromises);
    return this.parent.update({ system: { longNotes, longNotesFormat } });
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

  setHitThreshold = (hitThreshold: number) => {
    return this.parent.update({ system: { hitThreshold } });
  };

  setInitiativeAbility = async (initiativeAbility: string) => {
    await this.parent.update({ system: { initiativeAbility } });
    const isInCombat = !!this.parent.token?.combatant;
    if (isInCombat) {
      await this.parent.rollInitiative({ rerollInitiative: true });
    }
  };

  setPassingTurns = async (initiativePassingTurns: number) => {
    await this.parent.update({ system: { initiativePassingTurns } });
  };

  // ###########################################################################
  // Moribund World stuff
  setMwInjuryStatus = async (mwInjuryStatus: MwInjuryStatus) => {
    await this.parent.update({ system: { mwInjuryStatus } });
  };

  createEquipment = async (categoryId: string): Promise<void> => {
    await this.parent.createEmbeddedDocuments(
      "Item",
      [
        {
          // @ts-expect-error .type
          type: equipment,
          name: "New item",
          system: {
            category: categoryId,
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
          // @ts-expect-error .type
          type: card,
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
      (item): item is CardItem => isCardItem(item) && !item.system.continuity,
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
      slotIndex === occupationSlotIndex
        ? settings.genericOccupation.get()
        : `New ${settings.personalDetails.get()[slotIndex]?.name ?? "detail"}`;
    await this.parent.createEmbeddedDocuments(
      "Item",
      [
        {
          // @ts-expect-error .type
          type: personalDetail,
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

  getPushPool(): GeneralAbilityItem | undefined {
    return this.parent.items.find(
      (item: InvestigatorItem): item is GeneralAbilityItem =>
        isGeneralAbilityItem(item) && item.system.isPushPool,
    );
  }

  getPushPoolWarnings(): string[] {
    const warnings: string[] = [];
    const pools = this.parent.items.filter(
      (item: InvestigatorItem): item is GeneralAbilityItem =>
        isGeneralAbilityItem(item) && item.system.isPushPool,
    );
    const quickShockAbilities = this.parent.items.filter(
      (item: InvestigatorItem): item is InvestigativeAbilityItem =>
        isInvestigativeAbilityItem(item) && item.system.isQuickShock,
    );
    if (pools.length > 1) {
      warnings.push(getTranslated("TooManyPushPools"));
    }
    if (quickShockAbilities.length > 1 && pools.length < 1) {
      warnings.push(getTranslated("QuickShockAbilityWithoutPushPool"));
    }
    if (quickShockAbilities.length === 0 && pools.length > 0) {
      warnings.push(getTranslated("PushPoolWithoutQuickShockAbility"));
    }
    return warnings;
  }
}

export type PCActor = InvestigatorActor<typeof c.pc>;

export const isPCActor = (x: unknown): x is PCActor =>
  x instanceof InvestigatorActor && x.type === c.pc;

function _f(x: PCModel) {
  console.log(x.resources[0].value);
  x.cardsAreaSettings.category = "categorized";
  x.occupation = "foo";
  // @ts-expect-error this should be wrong
  x.cardsAreaSettings.category = "foo";
  x.longNotesFormat = "richText";
  // @ts-expect-error this should be wrong
  x.longNotesFormat = "sdfsdf";
}
