import {
  generalAbility,
  investigativeAbility,
  pc,
  npc,
  weapon,
  personalDetail,
  equipment,
  occupationSlotIndex,
} from "../constants";
import { assertGame, confirmADoodleDo } from "../functions";
import {
  AbilityType,
  MwType,
  MwRefreshGroup,
  NoteWithFormat,
  BaseNote,
  NoteFormat,
  MwInjuryStatus,
} from "../types";
import {
  assertPCDataSource,
  assertActiveCharacterDataSource,
  assertPartyDataSource,
  isAbilityDataSource,
  isMwItemDataSource,
  assertMwItemDataSource,
  assertNPCDataSource,
} from "../typeAssertions";
import { convertNotes } from "../textFunctions";
import { tealTheme } from "../themes/tealTheme";
import { runtimeConfig } from "../runtime";
import { settings } from "../settings";
import { ThemeV1 } from "../themes/types";

export class InvestigatorActor extends Actor {
  confirmRefresh = () => {
    confirmADoodleDo({
      message: "Refresh all of (actor name)'s abilities?",
      confirmText: "Refresh",
      cancelText: "Cancel",
      confirmIconClass: "fa-sync",
      values: { ActorName: this.data.name },
    }).then(this.refresh);
  };

  confirm24hRefresh = () => {
    confirmADoodleDo({
      message:
        "Refresh all of (actor name)'s abilities which refresh every 24h?",
      confirmText: "Refresh",
      cancelText: "Cancel",
      confirmIconClass: "fa-sync",
      values: { ActorName: this.data.name },
    }).then(this.refresh24h);
  };

  confirmMwRefresh(group: MwRefreshGroup) {
    return () => {
      confirmADoodleDo({
        message:
          "Refresh all of {ActorName}'s abilities which refresh every {Hours} Hours?",
        confirmText: "Refresh",
        cancelText: "Cancel",
        confirmIconClass: "fa-sync",
        values: { ActorName: this.data.name, Hours: group },
      }).then(() => this.mWrefresh(group));
    };
  }

  confirmMw2Refresh = this.confirmMwRefresh(2);
  confirmMw4Refresh = this.confirmMwRefresh(4);
  confirmMw8Refresh = this.confirmMwRefresh(8);

  refresh = () => {
    const updates = Array.from(this.items).flatMap((item) => {
      if (
        (item.data.type === generalAbility ||
          item.data.type === investigativeAbility) &&
        item.data.data.rating !== item.data.data.pool &&
        !item.data.data.excludeFromGeneralRefresh
      ) {
        return [
          {
            _id: item.data._id,
            data: {
              pool: item.data.data.rating,
            },
          },
        ];
      } else {
        return [];
      }
    });
    return this.updateEmbeddedDocuments("Item", updates);
  };

  mWrefresh(group: MwRefreshGroup) {
    const updates = Array.from(this.items).flatMap((item) => {
      if (
        item.data.type === generalAbility &&
        // MW refreshes allow you to keep a boon
        item.data.data.rating > item.data.data.pool &&
        item.data.data.mwRefreshGroup === group
      ) {
        return [
          {
            _id: item.data._id,
            data: {
              pool: item.data.data.rating,
            },
          },
        ];
      } else {
        return [];
      }
    });
    return this.updateEmbeddedDocuments("Item", updates);
  }

  // if we end up with even more types of refresh it may be worth factoring out
  // the actual refresh code but until then - rule of three
  refresh24h = () => {
    const updates = Array.from(this.items).flatMap((item) => {
      if (
        (item.data.type === generalAbility ||
          item.data.type === investigativeAbility) &&
        item.data.data.rating !== item.data.data.pool &&
        item.data.data.refreshesDaily
      ) {
        return [
          {
            _id: item.data._id,
            data: {
              pool: item.data.data.rating,
            },
          },
        ];
      } else {
        return [];
      }
    });
    this.updateEmbeddedDocuments("Item", updates);
  };

  confirmNuke = () => {
    confirmADoodleDo({
      message: "NukeAllOfActorNamesAbilitiesAndEquipment",
      confirmText: "Nuke it from orbit",
      cancelText: "Whoops no!",
      confirmIconClass: "fa-radiation",
      values: { ActorName: this.data.name },
    }).then(() => this.nuke());
  };

  nuke = async () => {
    await this.deleteEmbeddedDocuments(
      "Item",
      this.items.map((i) => i.id).filter((i) => i !== null) as string[],
    );
    ui.notifications?.info(`Nuked ${this.name}.`);
  };

  // ###########################################################################
  // ITEMS

  getAbilityByName(name: string, type?: AbilityType) {
    return this.items.find(
      (item) =>
        (type ? item.data.type === type : isAbilityDataSource(item.data)) &&
        item.name === name,
    );
  }

  getAbilityRatingByName(name: string) {
    return this.getAbilityByName(name)?.getRating() ?? 0;
  }

  getEquipment() {
    return this.items.filter((item) => item.type === equipment);
  }

  getWeapons() {
    return this.items.filter((item) => item.type === weapon);
  }

  getAbilities() {
    return this.items.filter((item) => isAbilityDataSource(item.data));
  }

  getPersonalDetails() {
    return this.items.filter((item) => item.type === personalDetail);
  }

  getMwItems() {
    const allItems = this.items.filter((item) => isMwItemDataSource(item.data));
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
      assertMwItemDataSource(item.data);
      items[item.data.data.mwType].push(item);
    }
    return items;
  }

  getTrackerAbilities() {
    return this.getAbilities().filter(
      (item) => isAbilityDataSource(item.data) && item.data.data.showTracker,
    );
  }

  // ###########################################################################
  // GETTERS GONNA GET
  // SETTERS GONNA SET
  // basically we have a getter/setter pair for every attribute so they can be
  // used as handy callbacks in the component tree
  // ###########################################################################

  getName = () => this.name;

  setName = (name: string) => {
    return this.update({ name });
  };

  getOccupation = () => {
    assertPCDataSource(this.data);
    return this.data.data.occupation;
  };

  setOccupation = (occupation: string) => {
    assertPCDataSource(this.data);
    return this.update({ data: { occupation } });
  };

  getSheetTheme(): ThemeV1 {
    const themeName =
      this.getSheetThemeName() || settings.defaultThemeName.get();
    const theme = runtimeConfig.themes[themeName];
    if (theme !== undefined) {
      return theme;
    } else if (
      runtimeConfig.themes[settings.defaultThemeName.get()] !== undefined
    ) {
      return runtimeConfig.themes[settings.defaultThemeName.get()];
    } else {
      return tealTheme;
    }
  }

  getSheetThemeName(): string | null {
    return this.data.type === pc || this.data.type === npc
      ? this.data.data.sheetTheme
      : null;
  }

  setSheetTheme = (sheetTheme: string | null) =>
    this.update({ data: { sheetTheme } });

  getNotes = () => {
    assertNPCDataSource(this.data);
    return this.data.data.notes;
  };

  setNotes = (notes: NoteWithFormat) => {
    assertNPCDataSource(this.data);
    return this.update({ data: { notes } });
  };

  getLongNote = (i: number) => {
    assertPCDataSource(this.data);
    return this.data.data.longNotes?.[i] ?? "";
  };

  getLongNotes = () => {
    assertPCDataSource(this.data);
    return this.data.data.longNotes ?? [];
  };

  setLongNote = (i: number, note: BaseNote) => {
    assertPCDataSource(this.data);
    const longNotes = [...(this.data.data.longNotes || [])];
    longNotes[i] = note;
    return this.update({ data: { longNotes } });
  };

  setLongNotesFormat = async (longNotesFormat: NoteFormat) => {
    assertPCDataSource(this.data);
    const longNotesPromises = (this.data.data.longNotes || []).map<
      Promise<BaseNote>
    >(async (note) => {
      assertPCDataSource(this.data);
      const { newHtml, newSource } = await convertNotes(
        this.data.data.longNotesFormat,
        longNotesFormat,
        note.source,
      );
      return {
        html: newHtml,
        source: newSource,
      };
    });
    const longNotes = await Promise.all(longNotesPromises);
    return this.update({ data: { longNotes, longNotesFormat } });
  };

  getShortNote = (i: number) => {
    assertPCDataSource(this.data);
    return this.data.data.shortNotes?.[i] ?? "";
  };

  getShortNotes = () => {
    assertPCDataSource(this.data);
    return this.data.data.shortNotes ?? [];
  };

  setShortNote = (i: number, text: string) => {
    assertPCDataSource(this.data);
    const newNotes = [...(this.data.data.shortNotes || [])];
    newNotes[i] = text;
    return this.update({
      data: {
        shortNotes: newNotes,
      },
    });
  };

  setMwHiddenShortNote = (i: number, text: string) => {
    assertPCDataSource(this.data);
    const newNotes = [...(this.data.data.hiddenShortNotes || [])];
    newNotes[i] = text;
    return this.update({
      data: {
        hiddenShortNotes: newNotes,
      },
    });
  };

  getHitThreshold = () => {
    assertActiveCharacterDataSource(this.data);
    return this.data.data.hitThreshold;
  };

  setHitThreshold = (hitThreshold: number) => {
    assertActiveCharacterDataSource(this.data);
    return this.update({ data: { hitThreshold } });
  };

  getInitiativeAbility = () => {
    assertActiveCharacterDataSource(this.data);
    return this.data.data.initiativeAbility;
  };

  setInitiativeAbility = async (initiativeAbility: string) => {
    assertGame(game);
    assertActiveCharacterDataSource(this.data);
    await this.update({ data: { initiativeAbility } });
    const isInCombat = !!this.token?.combatant;
    if (isInCombat) {
      await this.rollInitiative({ rerollInitiative: true });
    }
  };

  setCombatBonus = async (combatBonus: number) => {
    assertNPCDataSource(this.data);
    await this.update({ data: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number) => {
    assertNPCDataSource(this.data);
    await this.update({ data: { damageBonus } });
  };

  setPassingTurns = async (initiativePassingTurns: number) => {
    assertActiveCharacterDataSource(this.data);
    await this.update({ data: { initiativePassingTurns } });
  };

  // ###########################################################################
  // Moribund World stuff
  getMwInjuryStatus = () => {
    assertActiveCharacterDataSource(this.data);
    return this.data.data.mwInjuryStatus;
  };

  setMwInjuryStatus = async (mwInjuryStatus: MwInjuryStatus) => {
    assertActiveCharacterDataSource(this.data);
    await this.update({ data: { mwInjuryStatus } });
  };

  // ###########################################################################
  // For the party sheet
  getActorIds = () => {
    assertPartyDataSource(this.data);
    return this.data.data.actorIds;
  };

  setActorIds = (actorIds: string[]) => {
    assertPartyDataSource(this.data);
    return this.update({ data: { actorIds } });
  };

  getActors = () => {
    return this.getActorIds()
      .map((id) => {
        assertGame(game);
        return game.actors?.get(id);
      })
      .filter((actor) => actor !== undefined) as Actor[];
  };

  addActorIds = (newIds: string[]) => {
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
            actor.id !== null &&
            actor.data.type === pc &&
            !currentIds.includes(actor.id),
        ) as Actor[]
    ).map((actor) => actor.id) as string[];
    return this.setActorIds([...currentIds, ...effectiveIds]);
  };

  removeActorId = (id: string) => {
    return this.setActorIds(this.getActorIds().filter((x) => x !== id));
  };

  createEquipment = async (categoryId: string) => {
    await this.createEmbeddedDocuments(
      "Item",
      [
        {
          type: equipment,
          name: "New item",
          data: {
            category: categoryId,
          },
        },
      ],
      {
        renderSheet: true,
      },
    );
  };

  createPersonalDetail = async (slotIndex: number) => {
    const detailName =
      slotIndex === occupationSlotIndex
        ? settings.occupationLabel.get()
        : settings.shortNotes.get()[slotIndex] ?? "detail";
    const name = `New ${detailName}`;
    await this.createEmbeddedDocuments(
      "Item",
      [
        {
          type: personalDetail,
          name,
          data: {
            slotIndex,
          },
        },
      ],
      {
        renderSheet: true,
      },
    );
  };
}

declare global {
  interface DocumentClassConfig {
    Actor: typeof InvestigatorActor;
  }
}
