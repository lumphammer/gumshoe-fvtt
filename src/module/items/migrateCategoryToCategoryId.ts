import { isNullOrEmptyString } from "../../functions/utilities";

interface LegacyCategorySource {
  category?: unknown;
  categoryId?: unknown;
}

/** Rename the legacy category field before the DataModel schema drops it. */
export const migrateCategoryToCategoryId = (
  source: LegacyCategorySource,
  getFallbackCategoryId?: () => string,
) => {
  if (isNullOrEmptyString(source.categoryId)) {
    const categoryId = isNullOrEmptyString(source.category)
      ? getFallbackCategoryId?.()
      : source.category;
    if (typeof categoryId === "string") {
      source.categoryId = categoryId;
    }
  }
  delete source.category;
};
