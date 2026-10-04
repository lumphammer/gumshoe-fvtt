import {
  ArrayField,
  BooleanField,
  NumberField,
  SchemaField,
  StringField,
  TypedObjectField,
  TypeDataModel,
} from "../../fvtt-exports";
import { createLethalityFields } from "../schemaFields";
import { coverValues, fireModeValues } from "./rules";

const createDamageRollField = () =>
  new SchemaField({
    die: new NumberField({ nullable: false, required: true, initial: 0 }),
    total: new NumberField({ nullable: false, required: true, initial: 0 }),
  });

const createDamageRollsField = () =>
  new ArrayField(createDamageRollField(), {
    nullable: false,
    required: true,
    initial: [],
  });

const attackTargetSchema = {
  /** local id for this entry, so a token can't get confused with itself */
  id: new StringField({ nullable: false, required: true, blank: false }),
  tokenUuid: new StringField({ nullable: false, required: true }),
  /** snapshot, in case the token goes away */
  name: new StringField({ nullable: false, required: true }),
  img: new StringField({ nullable: false, required: true }),
  cover: new StringField({
    nullable: false,
    required: true,
    choices: coverValues,
    initial: "partial",
  }),
  /** when null, use the target's armor stat */
  armorOverride: new NumberField({
    nullable: true,
    required: true,
    initial: null,
  }),
  /** chosen to get Shot Dry's extra damage */
  shotDryBonus: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  damageRolls: createDamageRollsField(),
  /** a record of damage having been applied, so it can be undone */
  applied: new SchemaField(
    {
      previousHealth: new NumberField({ nullable: false, required: true }),
      newHealth: new NumberField({ nullable: false, required: true }),
    },
    { nullable: true, required: true, initial: null },
  ),
};

/**
 * The part of an attack message the combat rules care about. Kept separate so
 * it can be checked against the hand-written `AttackData` type which the pure
 * rules code uses (see attackDataTypes.test-d.ts).
 */
export const attackDataSchema = {
  fireMode: new StringField({
    nullable: false,
    required: true,
    choices: fireModeValues,
    initial: "single",
  }),
  hitTotal: new NumberField({ nullable: false, required: true, initial: 0 }),
  /** the unmodified die, for critical hits */
  hitDie: new NumberField({ nullable: false, required: true, initial: 0 }),
  /** snapshot of whether the attacker was Hurt when they attacked */
  attackerIsHurt: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  isGunfire: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  /** an unmodified 6 on full-auto, with the Shot Dry rule on */
  isShotDry: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  /** snapshot of the weapon's Lethality, if it has one and the rule is on */
  lethality: new SchemaField(createLethalityFields(), {
    nullable: true,
    required: true,
    initial: null,
  }),
  /** so we can roll more damage later, e.g. for a crit or a new target */
  damageFormula: new StringField({ nullable: false, required: true }),
  damageParams: new TypedObjectField(
    new NumberField({ nullable: false, required: true }),
    { nullable: false, required: true, initial: {} },
  ),
  /**
   * Damage rolls which belong to the attack but no target is using: to start
   * with, the one shown on the attack card, and later any rolls from a target
   * which has been removed. Targets take these before anything new gets
   * rolled, so damage doesn't change when you add, remove, or re-add a target.
   */
  unusedDamageRolls: createDamageRollsField(),
  targets: new ArrayField(new SchemaField(attackTargetSchema), {
    nullable: false,
    required: true,
    initial: [],
  }),
};

export const attackMessageSchema = {
  ...attackDataSchema,
  /** the weapon, which may be on an unlinked token's actor */
  weaponUuid: new StringField({ nullable: false, required: true }),
  /** snapshots, in case the weapon goes away */
  weaponName: new StringField({ nullable: false, required: true }),
  weaponImg: new StringField({ nullable: false, required: true }),
  rangeName: new StringField({ nullable: false, required: true }),
  /** whether this attack jammed the weapon */
  weaponJammed: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
};

/**
 * Chat message subtype for weapon attacks.
 */
export class AttackMessageModel extends TypeDataModel<
  typeof attackMessageSchema,
  ChatMessage.Implementation
> {
  static defineSchema(): typeof attackMessageSchema {
    return attackMessageSchema;
  }
}
