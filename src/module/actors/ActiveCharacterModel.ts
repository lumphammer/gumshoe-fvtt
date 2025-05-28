import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import { MwInjuryStatus } from "../../types";
import type { EquipmentItem } from "../items/equipment";
import type { AbilityItem } from "../items/exports";
import type { GeneralAbilityItem } from "../items/generalAbility";
import type { InvestigativeAbilityItem } from "../items/investigativeAbility";
import type { InvestigatorItem } from "../items/InvestigatorItem";
import type { WeaponItem } from "../items/weapon";

import TypeDataModel = foundry.abstract.TypeDataModel;
import DataSchema = foundry.data.fields.DataSchema;

function isAbilityItem(x: unknown): x is AbilityItem {
  return (
    x instanceof Item &&
    (x.type === "investigativeAbility" || x.type === "generalAbility")
  );
}

function isGeneralAbilityItem(x: unknown): x is GeneralAbilityItem {
  return x instanceof Item && x.type === "generalAbility";
}

function isInvestigativeAbilityItem(x: unknown): x is InvestigativeAbilityItem {
  return x instanceof Item && x.type === "investigativeAbility";
}

function isEquipmentItem(x: unknown): x is EquipmentItem {
  return x instanceof Item && x.type === "equipment";
}

function isWeaponItem(x: unknown): x is WeaponItem {
  return x instanceof Item && x.type === "weapon";
}

export class ActiveCharacterModel<
  TSchema extends DataSchema,
  TActor extends Actor,
> extends TypeDataModel<TSchema, TActor> {
  getAbilities(): AbilityItem[] {
    return this.parent.items.filter(isAbilityItem);
  }

  getGeneralAbilities(): GeneralAbilityItem[] {
    return this.getAbilities().filter(isGeneralAbilityItem);
  }

  getGeneralAbilityNames(): string[] {
    return this.getGeneralAbilities()
      .map((a) => a.name)
      .filter((n): n is string => n !== null);
  }

  getEquipment(): EquipmentItem[] {
    return this.parent.items.filter(isEquipmentItem);
  }

  getWeapons(): WeaponItem[] {
    return this.parent.items.filter(isWeaponItem);
  }

  getTrackerAbilities(): AbilityItem[] {
    return this.getAbilities().filter(
      (item): item is AbilityItem =>
        isAbilityItem(item) && item.system.showTracker,
    );
  }

  shouldBroadcastRefreshes(): boolean {
    assertGame(game);
    return !game.user.isGM;
  }

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

  setPassingTurns = async (initiativePassingTurns: number) => {
    await this.parent.update({ system: { initiativePassingTurns } });
  };

  setInitiativeAbility = async (initiativeAbility: string) => {
    await this.parent.update({ system: { initiativeAbility } });
    const isInCombat = !!this.parent.token?.combatant;
    if (isInCombat) {
      await this.parent.rollInitiative({ rerollInitiative: true });
    }
  };

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

  getPushPool(): GeneralAbilityItem | undefined {
    return this.parent.items.find(
      (item): item is GeneralAbilityItem =>
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

  // ###########################################################################
  // Moribund World stuff
  setMwInjuryStatus = async (mwInjuryStatus: MwInjuryStatus) => {
    await this.parent.update({ system: { mwInjuryStatus } });
  };
}
