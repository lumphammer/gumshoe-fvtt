import * as constants from "./constants";
export type AbilityType = typeof constants.investigativeAbility | typeof constants.generalAbility;

export type Resource = {
  min?: number,
  max: number,
  value: number,
}

// utility
export type DataSource<TType extends string, TData> = {
  type: TType,
  name: string,
  data: TData,
  img: string,
};

// #############################################################################
// #############################################################################
// Actor data stuff
// #############################################################################
// #############################################################################

// XXX I think there's a load of things in here we don't need, but let's revisit
// once we're on foundry-vtt-types
interface PCDataSourceData {
  buildPoints: number;
  health: number;
  stability: number;
  sanity: number;
  magic: number;

  occupation: string;

  longNotes: string[];
  shortNotes: string[];

  initiativeAbility: string;
  hideZeroRated: boolean;
  sheetTheme: string|null;
  resources: {
    health: Resource,
    sanity: Resource,
    stability: Resource,
    magic: Resource,
  };
}

interface PartyDataSourceData {
  // party stuff
  abilityNames: string[];
  actorIds: string[];
}

type PCDataSource = DataSource<typeof constants.pc, PCDataSourceData>;
type PartyDataSource = DataSource<typeof constants.party, PartyDataSourceData>;

type InvestigatorActorDataSource =
  | PCDataSource
  | PartyDataSource

declare global {
  interface SourceConfig {
    Actor: InvestigatorActorDataSource;
  }
  interface DataConfig {
    Actor: InvestigatorActorDataSource;
  }
}

export function isPCDataSource (data: InvestigatorActorDataSource | undefined | null): data is PCDataSource {
  return (data ? data.type === constants.pc : false);
}

export function assertPCDataSource (data: InvestigatorActorDataSource | undefined | null): asserts data is PCDataSource {
  if (!isPCDataSource(data)) {
    throw new Error("Not a PC");
  }
}

export function isPartyDataSource (data: InvestigatorActorDataSource): data is PartyDataSource {
  return (data.type === constants.party);
}

export function assertPartyDataSource (data: InvestigatorActorDataSource): asserts data is PartyDataSource {
  if (!isPartyDataSource(data)) {
    throw new Error("Not a Party");
  }
}

// #############################################################################
// #############################################################################
// Item stuff
// #############################################################################
// #############################################################################

/** Stuff that is in common between Equipment and Weapons */
interface BaseEquipmentDataSourceData {
  notes: string;
}

/**
 * data.data for equipment (currently the same as BaseEquipmentDataSourceData)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface EquipmentDataSourceData extends BaseEquipmentDataSourceData {
}

/** data.data for weapons */
interface WeaponDataSourceData extends BaseEquipmentDataSourceData {
  notes: string;
  ability: string;
  damage: number;
  pointBlankDamage: number;
  closeRangeDamage: number;
  nearRangeDamage: number;
  longRangeDamage: number;
  isPointBlank: boolean;
  isCloseRange: boolean;
  isNearRange: boolean;
  isLongRange: boolean;
  usesAmmo: boolean;
  ammoPerShot: number;
  ammo: {
    min: number,
    max: number,
    value: number,
  };
}

/** data.data for either type of ability */
export interface BaseAbilityDataSourceData {
  rating: number;
  pool: number;
  min: number;
  max: number;
  occupational: boolean;
  hasSpecialities: boolean;
  specialities: string[];
  showTracker: boolean;
  boost: boolean;
  category: string;
}

/** data.data for investigative abilities */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InvestigativeAbilityDataSourceData extends BaseAbilityDataSourceData {
}

/** data.data for general abilities */
export interface GeneralAbilityDataSourceData extends BaseAbilityDataSourceData {
  canBeInvestigative: boolean;
}

/** data for equipment */
export type EquipmentDataSource = DataSource<typeof constants.equipment, EquipmentDataSourceData>;

/** data for weapons */
export type WeaponDataSource = DataSource<typeof constants.weapon, WeaponDataSourceData>;

/** data for general abilities */
export type GeneralAbilityDataSource = DataSource<typeof constants.generalAbility, GeneralAbilityDataSourceData>;

/** data for investigative abilities */
export type InvestigativeAbilityDataSource = DataSource<typeof constants.investigativeAbility, InvestigativeAbilityDataSourceData>;

/** data for weapon OR equipment (rn this basically means "notes") */
export type WeaponOrEquipmentDataSource =
  | WeaponDataSource
  | EquipmentDataSource;

/** data for either of the ability types */
export type AbilityDataSource =
  | GeneralAbilityDataSource
  | InvestigativeAbilityDataSource;

/** data for any kind of item */
export type InvestigatorItemDataSource =
  | WeaponOrEquipmentDataSource
  | AbilityDataSource;

// now we crowbar this into the global type system using declaration merging
declare global {
  interface SourceConfig {
    Item: InvestigatorItemDataSource;
  }
  interface DataConfig {
    Item: InvestigatorItemDataSource;
  }
}

export function isGeneralAbilityDataSource (data: InvestigatorItemDataSource): data is GeneralAbilityDataSource {
  return data.type === constants.generalAbility;
}

export function isInvestigativeAbilityDataSource (data: InvestigatorItemDataSource): data is InvestigativeAbilityDataSource {
  return data.type === constants.investigativeAbility;
}

export function isAbilityDataSource (data: InvestigatorItemDataSource): data is AbilityDataSource {
  return isGeneralAbilityDataSource(data) || isInvestigativeAbilityDataSource(data);
}

/** assert that a data is some kind of ability */
export function assertAbilityDataSource (data: InvestigatorItemDataSource): asserts data is AbilityDataSource {
  if (!isAbilityDataSource(data)) {
    throw new Error("Not an ability");
  }
}

/** assert that a data is a weapon */
export function assertWeaponDataSource (data: InvestigatorItemDataSource): asserts data is WeaponDataSource {
  const isWeapon = data.type === constants.weapon;
  if (!isWeapon) {
    throw new Error("Not a weapon");
  }
}

export function assertWeaponOrEquipmentDataSource (data: InvestigatorItemDataSource): asserts data is WeaponOrEquipmentDataSource {
  const isWeaponOrEquipmentDataSource = data.type === constants.weapon || data.type === constants.equipment;
  if (!isWeaponOrEquipmentDataSource) {
    throw new Error("Not a weapon or equipment");
  }
}

// #############################################################################
// #############################################################################
// SETTINGS
// #############################################################################
// #############################################################################

// declare global {
//   namespace ClientSettings {
//     interface Values {
//       [constants["systemName"]]: boolean,
//     }
//   }
// }

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

/**
 * Like Partial<T>, but recursive.
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
  ? RecursivePartial<U>[]
  : T[P] extends Record<string, unknown>
  ? RecursivePartial<T[P]>
  : T[P];
};
