import { z } from "zod";

export const equipmentCategoriesValidator = z
  .record(
    z.string(),
    z.object({
      name: z.string(),
      fields: z.record(
        z.string(),
        z
          .object({
            name: z.string(),
          })
          .and(
            z.discriminatedUnion("type", [
              z.object({
                type: z.literal("string"),
                default: z.string(),
              }),
              z.object({
                type: z.literal("number"),
                default: z.number(),
                min: z.number().optional(),
                max: z.number().optional(),
              }),
              z.object({
                type: z.literal("checkbox"),
                default: z.boolean(),
              }),
            ]),
          ),
      ),
    }),
  )
  .optional();

export type ValidatorEquipmentCategories = z.infer<
  typeof equipmentCategoriesValidator
>;
