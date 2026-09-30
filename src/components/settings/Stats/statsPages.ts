import { npcStats, pcStats } from "./directions";

/**
 * The pages under the stats settings menu, in menu order.
 */
export const statsPages = [
  { direction: pcStats, label: "PC Stats" },
  { direction: npcStats, label: "NPC Stats" },
];
