import { AbilityDataSource, AbilityType } from "../../types";

export const typeHeaderKey = "typeHeader" as const;
export const categoryHeaderKey = "categoryHeader" as const;
export const abilityRowkey = "abilityRowString" as const;
export type TypeHeaderData = {
  rowType: typeof typeHeaderKey;
  abilityType: AbilityType;
};
export type CategoryHeaderData = {
  rowType: typeof categoryHeaderKey;
  category: string;
};
export type ActorAbilityInfo = {
  actorId: string;
  abilityId: string | undefined;
  rating: number | undefined;
};
export type AbilityRowData = {
  rowType: typeof abilityRowkey;
  abilityDataSource: AbilityDataSource;
  actorInfo: {
    [actorId: string]: ActorAbilityInfo;
  };
  total: number;
};
export type RowData = TypeHeaderData | CategoryHeaderData | AbilityRowData;
export const isTypeHeader = (data: RowData): data is TypeHeaderData =>
  data.rowType === typeHeaderKey;
export const isCategoryHeader = (data: RowData): data is CategoryHeaderData =>
  data.rowType === categoryHeaderKey;
