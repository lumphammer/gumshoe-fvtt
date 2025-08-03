import {
  ArrayField,
  SchemaField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";

const turnField = new SchemaField(
  {
    combatantId: new StringField({
      nullable: false,
      required: true,
      initial: "",
    }),
  },
  {
    nullable: false,
    required: true,
    initial: {},
  },
);

const turnArrayField = new ArrayField(turnField, {
  nullable: false,
  required: true,
  initial: [],
});

const roundField = new SchemaField(
  {
    turns: turnArrayField,
    jumpIns: new ArrayField(
      new StringField({
        nullable: false,
        required: true,
      }),
      {
        nullable: false,
        required: true,
        initial: [],
      },
    ),
  },
  { nullable: false, required: true, initial: { turns: [], jumpIns: [] } },
);

export const classicCombatSchema = {
  rounds: new ArrayField(roundField, {
    nullable: false,
    required: true,
    initial: [],
  }),
};

/**
 * Combat subtype for classic GUMSHOE combat.
 * This is the default combat type used in most GUMSHOE games.
 */
export class ClassicCombatModel extends TypeDataModel<
  typeof classicCombatSchema,
  InvestigatorCombat<"classic">
> {
  static defineSchema(): typeof classicCombatSchema {
    return classicCombatSchema;
  }
}

export type ClassicCombat = InvestigatorCombat<"classic">;

export function isClassicCombat(x: unknown): x is ClassicCombat {
  return x instanceof InvestigatorCombat && x.type === "classic";
}

export function assertClassicCombat(x: unknown): asserts x is ClassicCombat {
  if (!isClassicCombat(x)) {
    throw new Error("Expected combat to be a ClassicCombat");
  }
}
