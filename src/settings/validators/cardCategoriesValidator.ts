import { z } from "zod";

import { findDuplicate } from "../../functions/utilities";

const cardCategoryValidator = z.object({
  id: z.string(),
  singleName: z.string(),
  pluralName: z.string(),
  styleKey: z.string().optional(),
  threshold: z.number(),
  thresholdType: z.enum(["goal", "limit", "none"]),
});

export const cardCategoriesValidator = z
  .array(cardCategoryValidator)
  .superRefine((categories, context) => {
    const duplicateId = findDuplicate(categories.map(({ id }) => id));
    if (duplicateId === undefined) return;
    const duplicateIndex = categories.findLastIndex(
      ({ id }) => id === duplicateId,
    );
    context.addIssue({
      code: "custom",
      message: `Card category ID "${duplicateId}" is duplicated`,
      path: [duplicateIndex, "id"],
    });
  })
  .optional();

export type ValidatorCardCategories = z.infer<typeof cardCategoriesValidator>;
