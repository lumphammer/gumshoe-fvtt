import { AbilityItem } from "../../module/items/exports";
import { AbilityType } from "../../types";

export const typeHeaderKey = "typeHeader";
export const categoryHeaderKey = "categoryHeader";
export const abilityRowKey = "abilityRowString";
export type TypeHeaderData = {
  rowType: typeof typeHeaderKey;
  abilityType: AbilityType;
  /**
   * per-actor build point totals for this ability type
   */
  actorTotals: { [actorId: string]: number };
  /** the same, summed across the whole party */
  grandTotal: number;
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
  rowType: typeof abilityRowKey;
  abilityItem: AbilityItem;
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
