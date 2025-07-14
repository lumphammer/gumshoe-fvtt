import { z } from "zod";

export const statsValidator = z.record(
  z.string(),
  z.object({ name: z.string(), default: z.number() }),
);

export type ValidatorStats = z.infer<typeof statsValidator>;
