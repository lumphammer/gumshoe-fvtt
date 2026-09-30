import {
  npcAbilityPacks,
  npcStats,
  pcAbilityPacks,
  pcOptions,
  pcStats,
} from "./directions";

/**
 * The pages under the actors settings menu, in menu order.
 */
export const actorPages = [
  { direction: pcOptions, label: "PC Options" },
  { direction: pcAbilityPacks, label: "PC Ability compendiums" },
  { direction: npcAbilityPacks, label: "NPC Ability compendiums" },
  { direction: pcStats, label: "PC Stats" },
  { direction: npcStats, label: "NPC Stats" },
];
