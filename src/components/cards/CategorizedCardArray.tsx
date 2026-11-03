import { Fragment } from "react";

import { useSettings } from "../../hooks/useSettings";
import { CategorizedCardArrayCategory } from "./CategorizedCardArrayCategory";
import type { CardLayoutView } from "./functions";
import { categorizeCards } from "./functions";

interface CategorizedCardArrayProps {
  /** the cards, in order, from the actor's snapshot */
  cards: readonly CardLayoutView[];
}

export const CategorizedCardArray = ({ cards }: CategorizedCardArrayProps) => {
  const categories = useSettings((s) => s.cardCategories);
  const [categoriesMap, uncategorized] = categorizeCards(cards, categories);

  return (
    <>
      {categories.map((cat, i) => (
        <Fragment key={cat.id}>
          {i !== 0 && <hr css={{ margin: "2em 0em 0em" }} />}
          <CategorizedCardArrayCategory
            category={cat}
            cards={categoriesMap[cat.id]}
          />
        </Fragment>
      ))}
      {uncategorized.length > 0 && (
        <>
          <hr css={{ margin: "2em 0em 0em" }} />
          <CategorizedCardArrayCategory category={null} cards={uncategorized} />
        </>
      )}
    </>
  );
};

CategorizedCardArray.displayName = "CategorizedCardArray";
