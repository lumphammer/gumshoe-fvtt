import {
  ArrayField,
  BooleanField,
  NumberField,
  SchemaField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { stabilityStates } from "../stability/states";
import { difficultyModifierKinds } from "./outcome";

export const abilityTestMessageSchema = {
  /** the ability, which may be on an unlinked token's actor */
  abilityUuid: new StringField({ nullable: false, required: true }),
  /** snapshots, in case the ability goes away */
  abilityName: new StringField({ nullable: false, required: true }),
  abilityImg: new StringField({ nullable: false, required: true }),
  /** points spent from Bonds (Fall of DELTA GREEN, p. 120), by Bond name */
  bondSpends: new ArrayField(
    new SchemaField({
      name: new StringField({ nullable: false, required: true }),
      spend: new NumberField({ nullable: false, required: true }),
    }),
    { nullable: false, required: true, initial: () => [] },
  ),
  /**
   * What changed the Difficulty when the test was made (e.g. Shaken). With no
   * Difficulty, these are shown as reminders.
   */
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
  /** null if tests had no Difficulty when this one was made */
  difficulty: new SchemaField(
    {
      /**
       * the Difficulty before modifiers: the GM can change it. null until the
       * GM sets one: then the card waits to say how the test went.
       */
      base: new NumberField({
        nullable: true,
        required: true,
        integer: true,
        initial: 4,
      }),
      /** players can see the Difficulty and outcome */
      revealed: new BooleanField({
        nullable: false,
        required: true,
        initial: true,
      }),
    },
    { nullable: true, required: true, initial: null },
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
