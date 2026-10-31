import type {
  GeneralAbilityItem,
  GeneralAbilitySystemData,
} from "./generalAbility";
import { isGeneralAbilityItem } from "./generalAbility";
import type {
  InvestigativeAbilityItem,
  InvestigativeAbilitySystemData,
} from "./investigativeAbility";
import { isInvestigativeAbilityItem } from "./investigativeAbility";

export type AbilityItem = GeneralAbilityItem | InvestigativeAbilityItem;

export type AbilitySystemData =
  | GeneralAbilitySystemData
  | InvestigativeAbilitySystemData;

export function isAbilityItem(x: unknown): x is AbilityItem {
  return isGeneralAbilityItem(x) || isInvestigativeAbilityItem(x);
}

export function assertAbilityItem(x: unknown): asserts x is AbilityItem {
  if (!isAbilityItem(x)) {
    throw new Error("Expected an ability item");
  }
}
