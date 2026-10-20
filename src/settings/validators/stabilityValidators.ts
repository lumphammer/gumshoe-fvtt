import { z } from "zod";

import { findDuplicate } from "../../functions/utilities";

const stabilityStateValidator = z.object({
  name: z.string(),
  upTo: z.number(),
});

export const stabilityStatesValidator = z.object({
  shaken: stabilityStateValidator,
  shattered: stabilityStateValidator,
  gone: stabilityStateValidator,
});

const traumaTypeValidator = z.object({
  id: z.string(),
  name: z.string(),
  difficulty: z.number(),
  adaptedDifficulty: z.number(),
  causesSanityLoss: z.boolean(),
  useAdaptation: z.boolean(),
  cappedAbilities: z.array(z.string()),
  capsBonds: z.boolean(),
  refreshPenalty: z.number(),
});

export const traumaTypesValidator = z
  .array(traumaTypeValidator)
  .superRefine((types, context) => {
    const duplicateId = findDuplicate(types.map(({ id }) => id));
    if (duplicateId === undefined) return;
    context.addIssue({
      code: "custom",
      message: `Trauma type ID "${duplicateId}" is duplicated`,
      path: [types.findLastIndex(({ id }) => id === duplicateId), "id"],
    });
  });
