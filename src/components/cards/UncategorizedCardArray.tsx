import { getTranslated } from "../../functions/getTranslated";
import { useSettings } from "../../hooks/useSettings";
import { CardArray } from "./CardArray";
import type { CardLayoutView } from "./functions";
import { categorizeCards, summarizeCategoryCards } from "./functions";
import { outcome } from "../../styled-system/recipes";

interface UncategorizedCardArrayProps {
  /** the cards, in order, from the actor's snapshot */
  cards: readonly CardLayoutView[];
}

export const UncategorizedCardArray = ({
  cards,
}: UncategorizedCardArrayProps) => {
  const categories = useSettings((s) => s.cardCategories);
  const [categorizedCards, uncategorized] = categorizeCards(cards, categories);

  const summary = Object.entries(categorizedCards).map(
    ([categoryId, cards], i) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) {
        return "";
      }
      const [summary, isOverGoal, isOverLimit] = summarizeCategoryCards(
        cards,
        category,
      );
      return (
        <span
          key={categoryId}
          className={outcome({
            tone: isOverGoal ? "success" : isOverLimit ? "danger" : "neutral",
          })}
          css={{ marginRight: "1em" }}
        >
          {summary} {category.pluralName}
        </span>
      );
    },
  );

  return (
    <>
      <div css={{ marginTop: "0.5em" }}>
        {summary}
        {uncategorized.length > 0 &&
          summarizeCategoryCards(uncategorized, null)[0] +
            " " +
            getTranslated("Uncategorized")}
      </div>
      <CardArray cards={cards} />
    </>
  );
};

UncategorizedCardArray.displayName = "UncategorizedCardArray";
