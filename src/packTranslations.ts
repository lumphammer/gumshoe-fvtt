import type { PackTranslationsConfig } from "@lumphammer/shared-fvtt-bits/task-core/packTranslations";

const abilityTypes = ["generalAbility", "investigativeAbility"];

/**
 * What `pnpm run build-pack-translations` offers translators. Card categories
 * are ids, so only ability categories are translated. Translated categories
 * only match a world's categories if the GM has translated those too, but
 * translators have done the work, and it's how it has always behaved.
 */
export const packTranslationsConfig: PackTranslationsConfig = {
  babeleSourcePath: "babele-sources",
  translationsPath: "public/lang/babele",
  packTypes: ["Item", "JournalEntry"],
  mappings: {
    Item: { category: "system.categoryId" },
  },
  entry: (doc, defaultEntry) => {
    const categoryId: unknown = doc.system?.["categoryId"];
    return abilityTypes.includes(doc.type ?? "") && categoryId
      ? { ...defaultEntry, category: categoryId }
      : defaultEntry;
  },
};
