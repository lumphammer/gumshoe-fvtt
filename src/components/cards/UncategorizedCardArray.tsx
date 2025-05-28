import { useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { CardItem } from "../../module/items/card";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { CardArray } from "./CardArray";
import { categorizeCards, summarizeCategoryCards } from "./functions";

interface UncategorizedCardArrayProps {
  cards: CardItem[];
}

export const UncategorizedCardArray = ({
  cards,
}: UncategorizedCardArrayProps) => {
  const categories = settings.cardCategories.get();
  const [categorizedCards, uncategorized] = categorizeCards(cards, categories);
  const theme = useContext(ThemeContext);

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
          css={{
            marginRight: "1em",
            color: isOverGoal
              ? theme.colors.success
              : isOverLimit
                ? theme.colors.danger
                : undefined,
          }}
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
