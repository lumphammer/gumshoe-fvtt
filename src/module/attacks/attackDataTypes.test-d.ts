import { describe, expectTypeOf, it } from "vitest";

import type { SourceData } from "../../fvtt-exports";
import type { attackDataSchema } from "./AttackMessageModel";
import type { AttackData } from "./types";

// the rules code works with plain `AttackData` objects, which are read from and
// written back to the `system` data of attack chat messages. This keeps the
// hand-written type and the schema in step. (`toEqualTypeOf`, not mutual
// assignability, so a missing optional property can't slip through.)
describe("attackDataSchema", () => {
  it("should match AttackData", () => {
    expectTypeOf<
      SourceData<typeof attackDataSchema>
    >().toEqualTypeOf<AttackData>();
  });
});
