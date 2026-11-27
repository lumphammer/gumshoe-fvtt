import {
  ArrayField,
  BooleanField,
  NumberField,
  SchemaField,
  StringField,
  TypedObjectField,
  TypeDataModel,
} from "../../fvtt-exports";
import { stabilityStates } from "../stability/states";
import { difficultyModifierKinds } from "./outcome";

/**
 * - requested: waiting for the GM to set the Difficulty, with the points
 *   already spent. Nothing's been rolled.
 * - rolling: the GM's client is rolling it (and showing the dice).
 * - rolled: the message has its roll.
 * - cancelled: never rolled, and the points went back.
 */
export const abilityTestStatuses = [
  "requested",
  "rolling",
  "rolled",
  "cancelled",
] as const;

export type AbilityTestStatus = (typeof abilityTestStatuses)[number];

export const abilityTestMessageSchema = {
  status: new StringField({
    nullable: false,
    required: true,
    choices: abilityTestStatuses,
    initial: "rolled",
  }),
  /** the ability, which may be on an unlinked token's actor */
  abilityUuid: new StringField({ nullable: false, required: true }),
  /** snapshots, in case the ability goes away */
  abilityName: new StringField({ nullable: false, required: true }),
  abilityImg: new StringField({ nullable: false, required: true }),
  /** the roll, settled when the test is made, so the GM can roll it later */
  formula: new StringField({ nullable: false, required: true }),
  params: new TypedObjectField(
    new NumberField({ nullable: false, required: true }),
    { nullable: false, required: true, initial: () => ({}) },
  ),
  /** points spent from the ability's pool */
  spend: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 0,
  }),
  /** points spent from Bonds (Fall of DELTA GREEN, p. 120) */
  bondSpends: new ArrayField(
    new SchemaField({
      /** the Bond item on the same actor as the ability, to refund */
      id: new StringField({ nullable: false, required: true, initial: "" }),
      /** snapshot, in case the Bond goes away */
      name: new StringField({ nullable: false, required: true }),
      spend: new NumberField({ nullable: false, required: true }),
    }),
    { nullable: false, required: true, initial: () => [] },
  ),
  /** What changed the Difficulty when the test was made (e.g. Shaken) */
  difficultyModifiers: new ArrayField(
    new SchemaField({
      kind: new StringField({
        nullable: false,
        required: true,
        choices: difficultyModifierKinds,
      }),
      state: new StringField({
        nullable: false,
        required: true,
        choices: stabilityStates,
      }),
      amount: new NumberField({ nullable: false, required: true }),
    }),
    { nullable: false, required: true, initial: () => [] },
  ),
  /** while it's rolling, the user whose client is rolling it */
  rollingUserId: new StringField({
    nullable: true,
    required: true,
    initial: null,
  }),
  /**
   * asked for in blind mode: the request goes to the GM (so whoever asked can
   * still withdraw it), and the roll is blind
   */
  blindRoll: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  difficulty: new SchemaField(
    {
      /**
       * the Difficulty before modifiers. null while requested, or if it was
       * rolled without one. The GM can change it after the roll.
       */
      base: new NumberField({
        nullable: true,
        required: true,
        integer: true,
        initial: null,
      }),
      /** players see how it went, but not the number */
      hidden: new BooleanField({
        nullable: false,
        required: true,
        initial: false,
      }),
    },
    { nullable: false, required: true },
  ),
};

/**
 * Chat message subtype for ability tests.
 */
export class AbilityTestMessageModel extends TypeDataModel<
  typeof abilityTestMessageSchema,
  ChatMessage.Implementation
> {
  static defineSchema(): typeof abilityTestMessageSchema {
    return abilityTestMessageSchema;
  }
}

export type AbilityTestMessage = ChatMessage.OfType<"abilityTest">;

export function isAbilityTestMessage(
  message: ChatMessage,
): message is AbilityTestMessage {
  return message.type === "abilityTest";
}
