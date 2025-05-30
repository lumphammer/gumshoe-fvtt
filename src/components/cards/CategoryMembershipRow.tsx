import { CardCategory } from "@lumphammer/investigator-fvtt-types";
import { useCallback } from "react";

import { CardItem } from "../../module/items/card";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { Toggle } from "../inputs/Toggle";

interface CategoryMembershipRowProps {
  category: CardCategory;
  card: CardItem;
  index: number;
}

export const CategoryMembershipRow = ({
  category,
  card,
  index,
}: CategoryMembershipRowProps) => {
  const membership = card.system.cardCategoryMemberships.find(
    (m) => m.categoryId === category.id,
  );

  const handleToggleActive = useCallback(
    async (active: boolean) => {
      if (active) {
        await card.system.addCardCategoryMembership(category.id);
      } else {
        await card.system.removeCardCategoryMembership(category.id);
      }
    },
    [card, category.id],
  );

  const handleToggleNonlethal = useCallback(
    async (nonlethal: boolean) => {
      await card.system.setCardCategoryMembershipNonlethal(
        category.id,
        nonlethal,
      );
    },
    [card, category.id],
  );

  const handleSetWorth = useCallback(
    async (worth: number) => {
      await card.system.setCardCategoryMembershipWorth(category.id, worth);
    },
    [card, category.id],
  );

  return (
    <>
      <GridFieldStacked key={category.id}>
        {index !== 0 && <hr css={{ margin: "1em 0em" }} />}
        <h2>{category.singleName}</h2>
      </GridFieldStacked>
      <GridField label="Active">
        <Toggle checked={!!membership} onChange={handleToggleActive} />
      </GridField>
      {membership && category.thresholdType !== "none" && (
        <GridField label="Worth">
          <AsyncNumberInput
            value={membership.worth}
            onChange={handleSetWorth}
          />
        </GridField>
      )}
      {membership && category.thresholdType === "limit" && (
        <GridField label="Nonlethal">
          <Toggle
            checked={membership.nonlethal}
            onChange={handleToggleNonlethal}
          />
        </GridField>
      )}
    </>
  );
};

CategoryMembershipRow.displayName = "CategoryMembershipRow";
