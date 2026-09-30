import {
  notesFields,
  npcStats,
  pcOptions,
  pcStats,
  personalDetails,
} from "./directions";

/**
 * The pages under the actors settings menu, in menu order.
 */
export const actorPages = [
  { direction: pcOptions, label: "PC Options" },
  { direction: personalDetails, label: "Personal details" },
  { direction: notesFields, label: "Notes Fields" },
  { direction: pcStats, label: "PC Stats" },
  { direction: npcStats, label: "NPC Stats" },
];
