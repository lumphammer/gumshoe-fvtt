import { generalAbility, investigativeAbility } from "../constants";

type BaseAbilityTemplate = {
  category: string,
  hasSpecialities: boolean,
  specialities: string[],
  rating: number,
  pool: number,
  min: number,
  max: number,
  occupational: boolean,
  showTracker: boolean,
  img: string,
}

export type InvestigativeAbilityTemplate = {
  type: typeof investigativeAbility,
} & BaseAbilityTemplate;

export type GeneralAbilityTemplate = {
  type: typeof generalAbility,
  canBeInvestigative: boolean,
  refreshesDaily: boolean,
} & BaseAbilityTemplate;

type Name = {
  name: string,
};

export type BaseAbilityDump<T> = {
  [category: string]: Array<Name & Partial<T>>,
};

export type InvestigativeAbilitiesData = BaseAbilityDump<InvestigativeAbilityTemplate>;

export type GeneralAbilitiesData = BaseAbilityDump<GeneralAbilityTemplate>;
