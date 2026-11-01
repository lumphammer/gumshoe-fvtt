import type { CardCategory } from "@lumphammer/investigator-fvtt-types";
import { useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { ThemeContext } from "../../themes/ThemeContext";
import { CardArray } from "./CardArray";
import type { CardLayoutView } from "./functions";
import { summarizeCategoryCards } from "./functions";

interface CategorizedCardArrayCategoryProps {
  category: Readonly<CardCategory> | null;
  cards: readonly CardLayoutView[];
}

export const CategorizedCardArrayCategory = ({
  category,
  cards,
}: CategorizedCardArrayCategoryProps) => {
  "use memo";
  const theme = useContext(ThemeContext);
  const [summary, isOverGoal, isOverLimit] = summarizeCategoryCards(
    cards,
    category,
  );
  return (
    <>
      <h2
        css={{
          color: isOverGoal
            ? theme.colors.success
            : isOverLimit
              ? theme.colors.danger
              : undefined,
        }}
      >
        {category?.pluralName ?? getTranslated("Uncategorized")} ({summary})
      </h2>
      <CardArray cards={cards} />
    </>
  );
};

CategorizedCardArrayCategory.displayName = "CategorizedCardArrayCategory";
