import type { CardCategory } from "@lumphammer/investigator-fvtt-types";
import type React from "react";

import { getTranslated } from "../../functions/getTranslated";
import type { CardItem } from "../../module/items/card";
import type { CardCategoryMembership } from "../../types";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { CategoryMembershipRow } from "./CategoryMembershipRow";

interface EditCategoryMembershipsProps {
  /** only to write through */
  card: CardItem;
  memberships: readonly Readonly<CardCategoryMembership>[];
  styleKeyCategoryId: string | null;
  /** every card category, from the settings */
  categories: readonly CardCategory[];
}

export const EditCategoryMemberships = ({
  card,
  memberships,
  styleKeyCategoryId,
  categories,
}: EditCategoryMembershipsProps) => {
  const handleChangeStyleKeyCategoryId = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.currentTarget.value === "" ? null : e.currentTarget.value;
    await card.system.setCardStyleKeyCategoryId(value);
  };

  return (
    <>
      <InputGrid>
        <GridField label="Appearance">
          <Select
            value={styleKeyCategoryId ?? ""}
            onChange={handleChangeStyleKeyCategoryId}
          >
            <option value={""}>{getTranslated("Uncategorized")}</option>
            {categories
              .filter((category) =>
                memberships.some((m) => m.categoryId === category.id),
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.singleName}
                </option>
              ))}
          </Select>
        </GridField>
        {categories.map((category, index) => (
          <CategoryMembershipRow
            key={category.id}
            card={card}
            category={category}
            membership={memberships.find((m) => m.categoryId === category.id)}
            index={index}
          />
        ))}
      </InputGrid>
    </>
  );
};

EditCategoryMemberships.displayName = "EditCategoryMemberships";
