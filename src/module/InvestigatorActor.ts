// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */
import { CardsAreaSettings } from "../components/cards/types";
import {
  card,
  equipment,
  occupationSlotIndex,
  personalDetail,
} from "../constants";
import { confirmADoodleDo } from "../functions/confirmADoodleDo";
import { getTranslated } from "../functions/getTranslated";
import { convertNotes } from "../functions/textFunctions";
import { assertGame } from "../functions/utilities";
import { settings } from "../settings/settings";
import {
  AbilityType,
  BaseNote,
  MwInjuryStatus,
  MwRefreshGroup,
  MwType,
  NoteFormat,
  NoteWithFormat,
} from "../types";
import {
  AbilityItem,
  assertActiveCharacterActor,
  assertMwItem,
  assertNPCActor,
  assertPartyActor,
  assertPCActor,
  assertPersonalDetailItem,
  CardItem,
  GeneralAbilityItem,
  InvestigativeAbilityItem,
  isAbilityItem,
  isActiveCharacterActor,
  isCardItem,
  isEquipmentItem,
  isGeneralAbilityItem,
  isInvestigativeAbilityItem,
  isMwItem,
  isPCActor,
  isPersonalDetailItem,
  isWeaponItem,
  PersonalDetailItem,
} from "../v10Types";
import { InvestigatorItem } from "./InvestigatorItem";

export class InvestigatorActor extends Actor {
  shouldBrodcastRefreshes(): boolean {
    assertGame(game);
    return !game.user.isGM || isPCActor(this);
  }

  confirmRefresh = async (): Promise<void> => {
    const yes = await confirmADoodleDo({
      message: "Refresh all of (actor name)'s abilities?",
      confirmText: "Refresh",
      cancelText: "Cancel",
      confirmIconClass: "fa-sync",
      values: { ActorName: this.name ?? "" },
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
      values: { ActorName: this.name ?? "" },
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
        values: { ActorName: this.name ?? "", Hours: group },
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
    const updates = Array.from(this.items).flatMap((item) => {
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
    if (this.shouldBrodcastRefreshes()) {
      await this.broadcastUserMessage("RefreshedAllOfActorNamesAbilities");
    }
    await this.updateEmbeddedDocuments("Item", updates);
  };

  async mWrefresh(group: MwRefreshGroup): Promise<void> {
    const updates = Array.from(this.items).flatMap((item) => {
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
    if (this.shouldBrodcastRefreshes()) {
      await this.broadcastUserMessage(
        "RefreshedAllOfActorNamesHoursHoursRefreshAbilities",
        {
          Hours: group.toString(),
        },
      );
    }
    await this.updateEmbeddedDocuments("Item", updates);
  }

  // if we end up with even more types of refresh it may be worth factoring out
  // the actual refresh code but until then - rule of three
  refresh24h = async (): Promise<void> => {
    const updates = Array.from(this.items).flatMap((item) => {
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
    if (this.shouldBrodcastRefreshes()) {
      await this.broadcastUserMessage(
        "RefreshedAllOfActorNames24hRefreshAbilities",
      );
    }
    await this.updateEmbeddedDocuments("Item", updates);
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
        ActorName: this.name ?? "",
        UserName: game.user.name ?? "",
        ...extraData,
      }),
    };
    // @ts-expect-error .create
    await ChatMessage.create(chatData, {});
  };

  confirmNuke = async (): Promise<void> => {
    const yes = await confirmADoodleDo({
      message: "NukeAllOfActorNamesAbilitiesAndEquipment",
      confirmText: "Nuke it from orbit",
      cancelText: "Whoops no!",
      confirmIconClass: "fa-radiation",
      resolveFalseOnCancel: true,
      values: { ActorName: this.name ?? "" },
    });
    if (yes) {
      await this.nuke();
    }
  };

  nuke = async (): Promise<void> => {
    await this.deleteEmbeddedDocuments(
      "Item",
      this.items.map((i) => i.id).filter((i) => i !== null),
    );
    ui.notifications?.info(`Nuked ${this.name}.`);
  };

  // ###########################################################################
  // ITEMS

  // XXX type does not need to be optional
  getAbilityByName(name: string, type?: AbilityType): AbilityItem | undefined {
    return this.items.find(
      (item) =>
        isAbilityItem(item) &&
        // @ts-expect-error this.type
        (type ? item.type === type : true) &&
        item.name === name,
    ) as AbilityItem | undefined;
  }

  getEquipment(): InvestigatorItem[] {
    return this.items.filter(isEquipmentItem);
  }

  getWeapons(): InvestigatorItem[] {
    return this.items.filter(isWeaponItem);
  }

  getAbilities(): InvestigatorItem[] {
    return this.items.filter(isAbilityItem);
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
    return this.items.filter(isPersonalDetailItem);
  }

  getMwItems(): { [type in MwType]: Item[] } {
    const allItems = this.items.filter(isMwItem);
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

    for (const item of this.items.values()) {
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

  // ###########################################################################
  // GETTERS GONNA GET
  // SETTERS GONNA SET
  // basically we have a getter/setter pair for every attribute so they can be
  // used as handy callbacks in the component tree
  // ###########################################################################

  setName = (name: string): Promise<this | undefined> => {
    return this.update({ name });
  };

  getOccupations = (): PersonalDetailItem[] => {
    assertPCActor(this);
    return this.getPersonalDetailsInSlotIndex(occupationSlotIndex);
  };

  getPersonalDetailsInSlotIndex = (slotIndex: number): PersonalDetailItem[] => {
    assertPCActor(this);
    const personalDetailItems = this.getPersonalDetails().filter((item) => {
      assertPersonalDetailItem(item);
      return item.system.slotIndex === slotIndex;
    });
    return personalDetailItems;
  };

  getSheetThemeName(): string | null {
    return (
      (isActiveCharacterActor(this) && this.system.sheetTheme) ||
      settings.defaultThemeName.get()
    );
  }

  setSheetTheme = async (sheetTheme: string | null): Promise<void> => {
    await this.update({ system: { sheetTheme } });
  };

  setNotes = (notes: NoteWithFormat): Promise<this | undefined> => {
    assertNPCActor(this);
    return this.update({ system: { notes } });
  };

  setGMNotes = (gmNotes: NoteWithFormat): Promise<this | undefined> => {
    assertNPCActor(this);
    return this.update({ system: { gmNotes } });
  };

  getLongNote = (i: number): BaseNote => {
    assertPCActor(this);
    return this.system.longNotes?.[i] ?? "";
  };

  setLongNote = (i: number, note: BaseNote): Promise<this | undefined> => {
    assertPCActor(this);
    const longNotes = [...(this.system.longNotes || [])];
    longNotes[i] = note;
    return this.update({ system: { longNotes } });
  };

  setLongNotesFormat = async (
    longNotesFormat: NoteFormat,
  ): Promise<this | undefined> => {
    assertPCActor(this);
    const longNotesPromises = (this.system.longNotes || []).map<
      Promise<BaseNote>
    >(async (note) => {
      assertPCActor(this);
      const { newHtml, newSource } = await convertNotes(
        this.system.longNotesFormat,
        longNotesFormat,
        note?.source ?? "",
      );
      return {
        html: newHtml,
        source: newSource,
      };
    });
    const longNotes = await Promise.all(longNotesPromises);
    return this.update({ system: { longNotes, longNotesFormat } });
  };

  getShortNote = (i: number): string => {
    assertPCActor(this);
    return this.system.shortNotes?.[i] ?? "";
  };

  setShortNote = (i: number, text: string): Promise<this | undefined> => {
    assertPCActor(this);
    const newNotes = [...(this.system.shortNotes || [])];
    newNotes[i] = text;
    return this.update({
      system: {
        shortNotes: newNotes,
      },
    });
  };

  setMwHiddenShortNote = (
    i: number,
    text: string,
  ): Promise<this | undefined> => {
    assertPCActor(this);
    const newNotes = [...(this.system.hiddenShortNotes || [])];
    newNotes[i] = text;
    return this.update({
      system: {
        hiddenShortNotes: newNotes,
      },
    });
  };

  setHitThreshold = (hitThreshold: number): Promise<this | undefined> => {
    assertActiveCharacterActor(this);
    return this.update({ system: { hitThreshold } });
  };

  setInitiativeAbility = async (initiativeAbility: string): Promise<void> => {
    assertGame(game);
    assertActiveCharacterActor(this);
    await this.update({ system: { initiativeAbility } });
    const isInCombat = !!this.token?.combatant;
    if (isInCombat) {
      await this.rollInitiative({ rerollInitiative: true });
    }
  };

  setCombatBonus = async (combatBonus: number): Promise<void> => {
    assertNPCActor(this);
    await this.update({ system: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number): Promise<void> => {
    assertNPCActor(this);
    await this.update({ system: { damageBonus } });
  };

  setPassingTurns = async (initiativePassingTurns: number): Promise<void> => {
    assertActiveCharacterActor(this);
    await this.update({ system: { initiativePassingTurns } });
  };

  // ###########################################################################
  // Moribund World stuff
  setMwInjuryStatus = async (mwInjuryStatus: MwInjuryStatus): Promise<void> => {
    assertActiveCharacterActor(this);
    await this.update({ system: { mwInjuryStatus } });
  };

  // ###########################################################################
  // For the party sheet
  getActorIds = (): string[] => {
    assertPartyActor(this);
    return this.system.actorIds;
  };

  setActorIds = (actorIds: string[]): Promise<this | undefined> => {
    assertPartyActor(this);
    return this.update({ system: { actorIds } });
  };

  getActors = (): Actor[] => {
    return this.getActorIds()
      .map((id) => {
        assertGame(game);
        return game.actors?.get(id);
      })
      .filter((actor) => actor !== undefined) as Actor[];
  };

  addActorIds = (newIds: string[]): Promise<this | undefined> => {
    const currentIds = this.getActorIds();
    const effectiveIds = (
      newIds
        .map((id) => {
          assertGame(game);
          return game.actors?.get(id);
        })
        .filter(
          (actor) =>
            actor !== undefined &&
            // @ts-expect-error DocumentClassConfig
            isPCActor(actor) &&
            !currentIds.includes(actor.id),
        ) as Actor[]
    ).map((actor) => actor.id) as string[];
    return this.setActorIds([...currentIds, ...effectiveIds]);
  };

  removeActorId = (id: string): Promise<this | undefined> => {
    return this.setActorIds(this.getActorIds().filter((x) => x !== id));
  };

  createEquipment = async (categoryId: string): Promise<void> => {
    await this.createEmbeddedDocuments(
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
    await this.createEmbeddedDocuments(
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
    assertPCActor(this);
    await this.update({ system: { cardsAreaSettings } });
  };

  getNonContinuityCards = (): CardItem[] => {
    assertPCActor(this);
    return this.items.filter(
      (item): item is CardItem => isCardItem(item) && !item.system.continuity,
    );
  };

  endScenario = async (): Promise<void> => {
    assertPCActor(this);
    const nonContinuityCards = this.getNonContinuityCards();
    const ids = nonContinuityCards
      .map((c) => c.id)
      .filter((id): id is string => id !== null);
    await this.deleteEmbeddedDocuments("Item", ids);
    await this.update({ system: { scenario: null } });
  };

  createPersonalDetail = async (
    slotIndex: number,
    renderSheet = true,
  ): Promise<void> => {
    const name =
      slotIndex === occupationSlotIndex
        ? settings.genericOccupation.get()
        : `New ${settings.personalDetails.get()[slotIndex]?.name ?? "detail"}`;
    await this.createEmbeddedDocuments(
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
    assertActiveCharacterActor(this);
    return this.items.find(
      (item: InvestigatorItem): item is GeneralAbilityItem =>
        isGeneralAbilityItem(item) && item.system.isPushPool,
    );
  }

  getPushPoolWarnings(): string[] {
    assertActiveCharacterActor(this);
    const warnings: string[] = [];
    const pools = this.items.filter(
      (item: InvestigatorItem): item is GeneralAbilityItem =>
        isGeneralAbilityItem(item) && item.system.isPushPool,
    );
    const quickShockAbilities = this.items.filter(
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
