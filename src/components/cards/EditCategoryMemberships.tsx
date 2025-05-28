import React, { useCallback } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { CardItem } from "../../module/items/card";
import { settings } from "../../settings/settings";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { CategoryMembershipRow } from "./CategoryMembershipRow";

interface EditCategoryMembershipsProps {
  card: CardItem;
}

export const EditCategoryMemberships = ({
  card,
}: EditCategoryMembershipsProps) => {
  const categories = settings.cardCategories.get();

  const handleChangeStyleKeyCategoryId = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value === "" ? null : e.currentTarget.value;
      await card.system.setCardStyleKeyCategoryId(value);
    },
    [card],
  );

  return (
    <>
      <InputGrid>
        <GridField label="Appearance">
          <select
            value={card.system.styleKeyCategoryId ?? ""}
            onChange={handleChangeStyleKeyCategoryId}
          >
            <option value={""}>{getTranslated("Uncategorized")}</option>
            {categories
              .filter((category) =>
                card.system.cardCategoryMemberships.some(
                  (m) => m.categoryId === category.id,
                ),
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.singleName}
                </option>
              ))}
          </select>
        </GridField>
        {categories.map((category, index) => (
          <CategoryMembershipRow
            key={category.id}
            card={card}
            category={category}
            index={index}
          />
        ))}
      </InputGrid>
    </>
  );
};

EditCategoryMemberships.displayName = "EditCategoryMemberships";
