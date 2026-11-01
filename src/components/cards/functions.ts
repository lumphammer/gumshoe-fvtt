import type { CardCategory } from "@lumphammer/investigator-fvtt-types";

import { getTranslated } from "../../functions/getTranslated";
import { getById } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import type { CardCategoryMembership } from "../../types";

/**
 * Produce a string for a card summarizing its category memebr ships. Examples:
 *
 * * "Uncategorized"
 * * "Stress"
 * * "Shock (2)"
 * * "Injury (Nonlethal)"
 * * "Shock, Injury"
 * * "Shock (2), Injury (2)"
 */
export function summarizeCategoryMemberships(
  memberships: readonly Readonly<CardCategoryMembership>[],
  allCategories: readonly Readonly<CardCategory>[] = settings.cardCategories.get(),
): string {
  if (memberships.length === 0) {
    return getTranslated("Uncategorized");
  }
  const text = memberships
    .map((m) => {
      const name = getById(allCategories, m.categoryId)?.singleName;
      if (!name) {
        return "";
      }
      const nonlethal = m.nonlethal ? getTranslated("Nonlethal") : "";
      const worth = m.worth !== 1 ? `${m.worth}` : "";
      const annotation =
        worth && nonlethal
          ? ` (${worth} ${nonlethal})`
          : worth
            ? ` (${worth})`
            : nonlethal
              ? ` (${nonlethal})`
              : "";
      return `${name}${annotation}`;
    })
    .filter((c) => !!c)
    .join(", ");
  return text;
}

/**
 * What the card lists need of a card to group, count and sort it: from a
 * snapshot (or a live card).
 */
export type CardLayoutView = {
  id: string;
  name: string;
  system: {
    active: boolean;
    cardCategoryMemberships: readonly Readonly<CardCategoryMembership>[];
  };
};

/**
 * Count the number of cards, taking into account their "worth" in the given
 * category.
 */
export function countCards(
  cards: readonly CardLayoutView[],
  categoryId: string,
): number {
  return cards.reduce((acc, card) => {
    if (!card.system.active) {
      return acc;
    }
    const membership = card.system.cardCategoryMemberships.find(
      (m) => m.categoryId === categoryId,
    );
    return acc + (membership?.worth ?? 0);
  }, 0);
}

/**
 * Produce a string for a group of cards counting the total worth of the given
 * cards, plus a note of the goal or limit for the category if it has one. Also
 * takes into account nonlethal cards for limit categories.
 *
 * Examples:
 *
 * * "1"   (when there is no goal or limit)
 * * "2/3" (when there is a goal or limit of 3)
 * * "3/4" (when there is a goal or limit of 4)
 */
export function summarizeCategoryCards(
  cards: readonly CardLayoutView[],
  category: Readonly<CardCategory> | null,
): [string, boolean, boolean] {
  if (category === null) {
    return [cards.length.toString(), false, false];
  }

  const grandTotal = countCards(cards, category.id);

  const indexOfLastLethalCard = cards
    .map((card) => {
      const membership = card.system.cardCategoryMemberships.find(
        (m) => m.categoryId === category.id,
      );
      return membership?.nonlethal ?? false;
    })
    .lastIndexOf(false);

  const lethalCards = cards.slice(0, indexOfLastLethalCard + 1);
  const lethalCardsTotal = countCards(lethalCards, category.id);

  let total: string;
  let isOverGoal = false;
  let isOverLimit = false;
  if (category.thresholdType === "limit") {
    total = `${lethalCardsTotal}/${category.threshold}`;
    isOverLimit = lethalCardsTotal >= category.threshold;
  } else if (category.thresholdType === "goal") {
    total = `${grandTotal}/${category.threshold}`;
    isOverGoal = grandTotal >= category.threshold;
  } else {
    total = grandTotal.toString();
  }

  return [total, isOverGoal, isOverLimit];
}

/**
 * Given a list of cards and a list of categories, produce a map of category
 * id to cards for each category.
 */
export function categorizeCards<T extends CardLayoutView>(
  cards: readonly T[],
  categories: readonly Readonly<CardCategory>[],
): [Record<string, T[]>, T[]] {
  const categoriesMap = Object.fromEntries(
    categories.map((cat) => [
      cat.id,
      cards.filter((card) =>
        card.system.cardCategoryMemberships.some(
          (m) => m.categoryId === cat.id,
        ),
      ),
    ]),
  );
  const categoryIds = categories.map((cat) => cat.id);
  const uncategorized = cards.filter(
    (card) =>
      !card.system.cardCategoryMemberships.some((m) =>
        categoryIds.includes(m.categoryId),
      ),
  );
  return [categoriesMap, uncategorized];
}
