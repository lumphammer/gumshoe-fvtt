import type { CardCategory } from "@lumphammer/investigator-fvtt-types";

import { getTranslated } from "../../functions/getTranslated";
import { CardArray } from "./CardArray";
import type { CardLayoutView } from "./functions";
import { summarizeCategoryCards } from "./functions";
import { outcome } from "../../styled-system/recipes";

interface CategorizedCardArrayCategoryProps {
  category: Readonly<CardCategory> | null;
  cards: readonly CardLayoutView[];
}

export const CategorizedCardArrayCategory = ({
  category,
  cards,
}: CategorizedCardArrayCategoryProps) => {
  const [summary, isOverGoal, isOverLimit] = summarizeCategoryCards(
    cards,
    category,
  );
  return (
    <>
      <h2
        className={outcome({
          tone: isOverGoal ? "success" : isOverLimit ? "danger" : "neutral",
        })}
      >
        {category?.pluralName ?? getTranslated("Uncategorized")} ({summary})
      </h2>
      <CardArray cards={cards} />
    </>
  );
};

CategorizedCardArrayCategory.displayName = "CategorizedCardArrayCategory";
