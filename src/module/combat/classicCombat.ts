import { systemLogger } from "../../functions/utilities";
import {
  ArrayField,
  DataModel,
  SchemaField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";

// /////////////////////////////////////////////////////////////////////////////
// Schema Definition

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
  constructor(
    ...[data, options]: DataModel.ConstructorArgs<
      typeof classicCombatSchema,
      ClassicCombat
    >
  ) {
    const error = new Error();
    systemLogger.debug(
      "ClassicCombatModel constructor called",
      data,
      options?.parent,
      error.stack,
    );

    super(data, options);
  }

  static defineSchema(): typeof classicCombatSchema {
    return classicCombatSchema;
  }

  override async _preUpdate(
    ...[changes, options, user]: Parameters<
      TypeDataModel<typeof classicCombatSchema, ClassicCombat>["_preUpdate"]
    >
  ) {
    console.log("ClassicCombatModel#_preUpdate called", changes, options, user);
    return super._preUpdate(changes, options, user);
  }

  /** override */
  override _onUpdate(
    ...[changed, options, userId]: Parameters<
      TypeDataModel<typeof classicCombatSchema, ClassicCombat>["_onUpdate"]
    >
  ) {
    console.log(
      "ClassicCombatModel#_onUpdate called",
      changed,
      options,
      userId,
    );
    return super._onUpdate(changed, options, userId);
  }

  _preParentUpdate() {
    systemLogger.debug("ClassicCombatModel#_preParentUpdate called");

    // No specific pre-update logic for ClassicCombat
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
