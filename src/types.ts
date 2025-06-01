import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";

import * as constants from "./constants";
// SOCKET STUFF ----------------------------------------------------------------

/**
 * data send out over the game websocket to request all clients to call the
 * hook `hook` with the given payload
 */
export type SocketHookAction<T> = {
  hook: string;
  payload: T;
};

/**
 * args passed to the `requestTurnPass` hook. this is sent out over the
 * websocket and broadcast to everyone. the GM's client picks it up and acts on
 * it.
 */
export type RequestTurnPassArgs = {
  combatantId: string;
};

// FOUNDRY STUFF ---------------------------------------------------------------

/** Foundry's idea of a resource */
export type Resource = {
  min?: number;
  max: number;
  value: number;
};

// NOTES -----------------------------------------------------------------------

/**
 * Enum for the types of notes formats we support.
 */
export type NoteFormat = "plain" | "richText" | "markdown";

/**
 * Sometimes notes don't have a format specified, when the format is handeled
 * externally. E.g. for PCs, the format is specified in the actor data so you
 * get the same format across all notes fields. This type represents the bare
 * minimum of a note, the source and the rendered output.
 */
export type BaseNote = {
  source: string;
  html: string;
};

/**
 * For notes where they need their own format.
 */
export type NoteWithFormat = BaseNote & {
  format: NoteFormat;
};

// MORIBUND WORLD --------------------------------------------------------------

/** MW Injury status */
export type MwInjuryStatus =
  | "uninjured"
  | "hurt"
  | "down"
  | "unconscious"
  | "dead";

/** difficulty levels for MW */
export type MWDifficulty = "easy" | number;

// #############################################################################
// #############################################################################
// Item stuff
// #############################################################################
// #############################################################################

export type AbilityType =
  | typeof constants.investigativeAbility
  | typeof constants.generalAbility;

export type Unlock = {
  id: string;
  rating: number;
  description: string;
};

export type SituationalModifier = {
  id: string;
  situation: string;
  modifier: number;
};

export type SpecialitiesMode = "one" | "twoThreeFour";

export type MwRefreshGroup = 2 | 4 | 8;

export type MwType =
  | "tweak"
  | "spell"
  | "cantrap"
  | "enchantedItem"
  | "meleeWeapon"
  | "missileWeapon"
  | "manse"
  | "sandestin"
  | "retainer";
export type RangeTuple = [number, number, number, number];

/** system data forMoribund World stuff */
export type MwItemSystemData = {
  mwType: MwType;
  notes: NoteWithFormat;
  charges: number;
  ranges: RangeTuple;
};

/** system data forpersonal details */
export type PersonalDetailSystemData = {
  notes: NoteWithFormat;
  slotIndex: number;
  compendiumPackId: string | null;
};

export type CardCategoryMembership = {
  categoryId: string;
  nonlethal: boolean;
  worth: number;
};

export type CardSystemData = {
  cardCategoryMemberships: CardCategoryMembership[];
  styleKeyCategoryId: string | null;
  supertitle: string;
  title: string;
  subtitle: string;
  effects: NoteWithFormat;
  description: NoteWithFormat;
  type: string;
  flags: string[];
  active: boolean;
  continuity: boolean;
};

// #############################################################################
// #############################################################################
// UTILITY LIBRARY
// #############################################################################
// #############################################################################

/**
 * this is wild - extract a subset of prperties from a type based on a test
 * see https://stackoverflow.com/a/57386444/212676
 *
 * this was a dumb experiment but i'm leaving it here because TS is cool.
 */
export type PickByType<T, P> = Omit<
  T,
  { [K in keyof T]: T[K] extends P ? never : K }[keyof T]
>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type RecursivePartial<T> = T extends Function
  ? T
  : {
      [P in keyof T]?: RecursivePartial<T[P]>;
    };

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type RecursiveRequired<T> = T extends Function
  ? T
  : {
      [P in keyof T]-?: RecursiveRequired<T[P]>;
    };

export type EquipmentFieldType = Pick<EquipmentFieldMetadata, "type">["type"];

export type Mandatory<T> = Exclude<T, undefined | null>;
