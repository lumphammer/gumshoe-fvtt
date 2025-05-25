import { CardCategory } from "@lumphammer/investigator-fvtt-types";

import { getTranslated } from "../../functions/getTranslated";
import { getById } from "../../functions/utilities";
import { CardItem } from "../../module/items/card";
import { settings } from "../../settings/settings";
import { CardCategoryMembership } from "../../types";

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
  memberships: CardCategoryMembership[],
): string {
  if (memberships.length === 0) {
    return getTranslated("Uncategorized");
  }
  const allCategories = settings.cardCategories.get();
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
 * Count the number of cards, taking into account their "worth" in the given
 * category.
 */
export function countCards(cards: CardItem[], categoryId: string): number {
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
  cards: CardItem[],
  category: CardCategory | null,
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

  let total = "";
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
export function categorizeCards(
  cards: CardItem[],
  categories: CardCategory[],
): [Record<string, CardItem[]>, CardItem[]] {
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
