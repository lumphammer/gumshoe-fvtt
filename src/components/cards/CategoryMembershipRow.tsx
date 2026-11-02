import type { CardCategory } from "@lumphammer/investigator-fvtt-types";

import type { CardItem } from "../../module/items/card";
import type { CardCategoryMembership } from "../../types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { Toggle } from "../inputs/Toggle";

interface CategoryMembershipRowProps {
  category: CardCategory;
  /** only to write through */
  card: CardItem;
  /** the card's membership of the category, if it's in it */
  membership: Readonly<CardCategoryMembership> | undefined;
  index: number;
}

export const CategoryMembershipRow = ({
  category,
  card,
  membership,
  index,
}: CategoryMembershipRowProps) => {
  "use memo";

  const handleToggleActive = async (active: boolean) => {
    if (active) {
      await card.system.addCardCategoryMembership(category.id);
    } else {
      await card.system.removeCardCategoryMembership(category.id);
    }
  };

  const handleToggleNonlethal = async (nonlethal: boolean) => {
    await card.system.setCardCategoryMembershipNonlethal(
      category.id,
      nonlethal,
    );
  };

  const handleSetWorth = async (worth: number) => {
    await card.system.setCardCategoryMembershipWorth(category.id, worth);
  };

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
