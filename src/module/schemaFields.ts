import type { AnyObject } from "fvtt-types/utils";

import type { DataField } from "../fvtt-exports";
import {
  BooleanField,
  NumberField,
  ObjectField,
  SchemaField,
  StringField,
  TypedObjectField,
} from "../fvtt-exports";

export const createNotesWithFormatField = () =>
  new SchemaField({
    format: new StringField({
      nullable: false,
      required: true,
      choices: ["plain", "richText", "markdown"],
      initial: "richText",
    }),
    source: new StringField({ nullable: false, required: true }),
    html: new StringField({ nullable: false, required: true }),
  });

export const createResourcesField = () =>
  new TypedObjectField(
    new SchemaField({
      // min?: number;
      min: new NumberField({
        nullable: true,
        required: false,
        initial: 0,
      }),
      // max: number;
      max: new NumberField({
        nullable: false,
        required: true,
        initial: 0,
      }),
      // value: number;
      value: new NumberField({
        nullable: false,
        required: true,
        initial: 0,
      }),
    }),
    {
      nullable: false,
      required: true,
      validateKey: (key: unknown): key is string => {
        return typeof key === "string";
      },
    },
  );

export const createStatsField = () =>
  new TypedObjectField(
    new NumberField({
      nullable: false,
      required: true,
      initial: 0,
    }),
    {
      nullable: false,
      required: true,
      initial: () => ({
        hitThreshold: 3,
      }),
      validateKey: (key: unknown): key is string => {
        return typeof key === "string";
      },
    },
  );

/** A Lethality rating, e.g. L1**HH (see module/attacks/lethality.ts) */
export const createLethalityFields = () => ({
  rating: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 1,
  }),
  asterisks: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 0,
  }),
  hs: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 0,
  }),
});

export const createRecordField = <T extends AnyObject>(
  options: DataField.Options<T>,
) => new ObjectField<DataField.Options<T>, T, T, T>(options);

export const createActiveCharacterSchema = () => {
  return {
    initiativeAbility: new StringField({
      nullable: false,
      required: true,
      initial: "",
    }),
    initiativePassingTurns: new NumberField({
      nullable: false,
      required: true,
      initial: 1,
      min: 0,
    }),
    /** For gunfire on humans (PCs who have become ghouls etc. aren’t) */
    isHuman: new BooleanField({
      nullable: false,
      required: true,
      initial: true,
    }),
    mwInjuryStatus: new StringField({
      nullable: false,
      required: true,
      choices: ["uninjured", "hurt", "down", "unconscious", "dead"],
      initial: "uninjured",
    }),
    /**
     * The id of the weapon the character has ready, shown on their Combat
     * tab; only one at a time. Empty (or a deleted weapon's id) means none.
     */
    readyWeaponId: new StringField({
      nullable: false,
      required: true,
      initial: "",
    }),
    resources: createResourcesField(),
    stats: createStatsField(),
  };
};
