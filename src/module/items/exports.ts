import { GeneralAbilityItem, isGeneralAbilityItem } from "./generalAbility";
import {
  InvestigativeAbilityItem,
  isInvestigativeAbilityItem,
} from "./investigativeAbility";

export type AbilityItem = GeneralAbilityItem | InvestigativeAbilityItem;

export function isAbilityItem(x: unknown): x is AbilityItem {
  return isGeneralAbilityItem(x) || isInvestigativeAbilityItem(x);
}

export function assertAbilityItem(x: unknown): asserts x is AbilityItem {
  if (!isAbilityItem(x)) {
    throw new Error("Expected an ability item");
  }
}
