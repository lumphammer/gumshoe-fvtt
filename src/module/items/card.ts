import { createNotesWithFormatField } from "../schemaFields";
import StringField = foundry.data.fields.StringField;
import SchemaField = foundry.data.fields.SchemaField;
import ArrayField = foundry.data.fields.ArrayField;
import BooleanField = foundry.data.fields.BooleanField;
import NumberField = foundry.data.fields.NumberField;
import TypeDataModel = foundry.abstract.TypeDataModel;
import { getById } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import { CardSystemData, NoteWithFormat } from "../../types";
import { InvestigatorItem } from "./InvestigatorItem";

export const cardSchema = {
  active: new BooleanField({ nullable: false, required: true, initial: true }),
  cardCategoryMemberships: new ArrayField(
    new SchemaField(
      {
        categoryId: new StringField({ nullable: false, required: true }),
        nonlethal: new BooleanField({ nullable: false, required: true }),
        worth: new NumberField({ nullable: false, required: true }),
      },
      { nullable: false, required: true },
    ),
  ),
  continuity: new BooleanField({ nullable: false, required: true }),
  description: createNotesWithFormatField(),
  effects: createNotesWithFormatField(),
  flags: new ArrayField(new StringField({ nullable: false, required: true }), {
    nullable: false,
    required: true,
  }),
  styleKeyCategoryId: new StringField({ nullable: true, required: true }),
  subtitle: new StringField({ nullable: false, required: true }),
  supertitle: new StringField({ nullable: false, required: true }),
  title: new StringField({ nullable: false, required: true }),
  type: new StringField({ nullable: false, required: true }),
};

export class CardModel extends TypeDataModel<typeof cardSchema, CardItem> {
  static defineSchema(): typeof cardSchema {
    return cardSchema;
  }

  setActive = async (active: boolean): Promise<void> => {
    await this.parent.update({ system: { active } });
  };

  setContinuity = async (continuity: boolean): Promise<void> => {
    await this.parent.update({ system: { continuity } });
  };

  setSupertitle = (supertitle: string) => {
    return this.parent.update({ system: { supertitle } });
  };

  setSubtitle = (subtitle: string) => {
    return this.parent.update({ system: { subtitle } });
  };

  setDescription = (description: NoteWithFormat) => {
    return this.parent.update({ system: { description } });
  };

  setEffects = (effects: NoteWithFormat) => {
    return this.parent.update({ system: { effects } });
  };

  addCardCategoryMembership = async (
    newStyleKeyCategoryId: string,
  ): Promise<void> => {
    // bail if we already have this category
    if (
      this.cardCategoryMemberships.some(
        (m) => m.categoryId === newStyleKeyCategoryId,
      )
    ) {
      return;
    }
    const existingStyleKeyCategoryId = this.styleKeyCategoryId;
    const existingStyleKeyCategory =
      existingStyleKeyCategoryId === null
        ? null
        : getById(settings.cardCategories.get(), existingStyleKeyCategoryId);
    const existingStyleKeyCategoryMembership =
      this.cardCategoryMemberships.find(
        (m) => m.categoryId === existingStyleKeyCategoryId,
      );
    // if we don't already have a styleKeyCategoryId,
    // or (the styleKeyCategoryId doesn't map to a real category)
    // or we don't have a memberhip for the styleKeyCategoryId
    const styleKeyCategoryId =
      existingStyleKeyCategoryId === null ||
      !existingStyleKeyCategory ||
      !existingStyleKeyCategoryMembership
        ? newStyleKeyCategoryId
        : existingStyleKeyCategoryId;

    const updateData: Pick<
      CardSystemData,
      "cardCategoryMemberships" | "styleKeyCategoryId"
    > = {
      cardCategoryMemberships: [
        ...this.cardCategoryMemberships,
        {
          categoryId: newStyleKeyCategoryId,
          nonlethal: false,
          worth: 1,
        },
      ],
      styleKeyCategoryId,
    };
    await this.parent.update({ system: updateData });
  };

  removeCardCategoryMembership = async (categoryId: string): Promise<void> => {
    const updateData: Pick<
      CardSystemData,
      "cardCategoryMemberships" | "styleKeyCategoryId"
    > = {
      cardCategoryMemberships: this.cardCategoryMemberships.filter(
        (m) => m.categoryId !== categoryId,
      ),
      styleKeyCategoryId: this.styleKeyCategoryId,
    };
    if (this.styleKeyCategoryId === categoryId) {
      const validMemberCategories = settings.cardCategories
        .get()
        .filter((m) =>
          updateData.cardCategoryMemberships.some((c) => c.categoryId === m.id),
        );
      updateData.styleKeyCategoryId =
        validMemberCategories.length > 0 ? validMemberCategories[0].id : null;
    }
    await this.parent.update({ system: updateData });
  };

  setCardCategoryMembershipNonlethal = async (
    categoryId: string,
    nonlethal: boolean,
  ): Promise<void> => {
    const updateData: Pick<CardSystemData, "cardCategoryMemberships"> = {
      cardCategoryMemberships: this.cardCategoryMemberships.map((m) => {
        if (m.categoryId === categoryId) {
          return {
            ...m,
            nonlethal,
          };
        } else {
          return m;
        }
      }),
    };
    await this.parent.update({ system: updateData });
  };

  setCardCategoryMembershipWorth = async (
    categoryId: string,
    worth: number,
  ): Promise<void> => {
    const updateData: Pick<CardSystemData, "cardCategoryMemberships"> = {
      cardCategoryMemberships: this.cardCategoryMemberships.map((m) => {
        if (m.categoryId === categoryId) {
          return {
            ...m,
            worth,
          };
        } else {
          return m;
        }
      }),
    };
    await this.parent.update({ system: updateData });
  };

  setCardStyleKeyCategoryId = async (
    categoryId: string | null,
  ): Promise<void> => {
    const updateData: Pick<CardSystemData, "styleKeyCategoryId"> = {
      styleKeyCategoryId: categoryId,
    };
    await this.parent.update({ system: updateData });
  };

  unsetCardStyleKeyCategoryId = async (): Promise<void> => {
    const updateData: Pick<CardSystemData, "styleKeyCategoryId"> = {
      styleKeyCategoryId: null,
    };
    await this.parent.update({ system: updateData });
  };
}

export type CardItem = InvestigatorItem<"card">;

export function isCardItem(x: unknown): x is CardItem {
  return x instanceof InvestigatorItem && x.type === "card";
}

export function assertCardItem(x: unknown): asserts x is CardItem {
  if (!isCardItem(x)) {
    throw new Error("Item is not a card");
  }
}
