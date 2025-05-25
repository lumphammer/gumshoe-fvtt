import { escape } from "html-escaper";

import {
  generalAbility,
  generalAbilityIcon,
  investigativeAbility,
  investigativeAbilityIcon,
} from "../../constants";
import { isNullOrEmptyString } from "../../functions/utilities";
import { EquipmentItem } from "../../module/items/equipment";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { niceBlackAgentsPreset } from "../../presets";
import {
  getDefaultGeneralAbilityCategory,
  settings,
} from "../../settings/settings";

export const addCategoryToGeneralAbilities = (
  item: InvestigatorItem,
  updateData: any,
) => {
  if (
    isGeneralAbilityItem(item) &&
    // types inside migrations are funny, and anyway I want to get rid of these
    // legacy migrations soon
    isNullOrEmptyString(item.system.categoryId)
  ) {
    const cat = getDefaultGeneralAbilityCategory();
    if (!updateData.system) {
      updateData.system = {};
    }
    updateData.system.category = cat;
  }
  return updateData;
};

export const setTrackersForPreAlpha4Updates = (
  item: InvestigatorItem,
  updateData: any,
) => {
  const currentlyMigratedVersion = settings.systemMigrationVersion.get();
  const needsMigrationVersion = "1.0.0-alpha.5";
  const needsMigration = foundry.utils.isNewerVersion(
    needsMigrationVersion,
    currentlyMigratedVersion,
  );
  const isRelevant = ["Health", "Sanity", "Stability", "Magic"].includes(
    item.name ?? "",
  );

  if (item.type === generalAbility && needsMigration && isRelevant) {
    updateData.system.showTracker = true;
  }
  return updateData;
};

export const setIconForAbilities = (
  item: InvestigatorItem,
  updateData: any,
) => {
  if (
    (item.type === generalAbility || item.type === investigativeAbility) &&
    (isNullOrEmptyString(item.img) || item.img === "icons/svg/mystery-man.svg")
  ) {
    updateData.img =
      item.type === generalAbility
        ? generalAbilityIcon
        : investigativeAbilityIcon;
  }
  return updateData;
};

export const upgradeNotesToRichText = (
  item: InvestigatorItem,
  updateData: any,
) => {
  if ("notes" in item.system && typeof item.system["notes"] === "string") {
    if (!updateData.system) {
      updateData.system = {};
    }
    updateData.system.notes = {
      format: "plain",
      source: item.system["notes"],
      html: escape(item.system["notes"]),
    };
  }
  return updateData;
};

export const setEquipmentCategory = (item: EquipmentItem, updateData: any) => {
  const categories = settings.equipmentCategories.get();
  // we are only proceeding if we have default categories, so it's either a brave new world, or we're migrating
  if (
    JSON.stringify(categories) ===
    JSON.stringify(niceBlackAgentsPreset.equipmentCategories)
  ) {
    /// XXX WIP
  }

  if (
    item.type === "equipment" &&
    isNullOrEmptyString(item.system.categoryId)
  ) {
    if (!updateData.system) {
      updateData.system = {};
    }
    updateData.system.category = "Other";
  }
  return updateData;
};
