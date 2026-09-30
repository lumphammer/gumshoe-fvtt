import type { SettingsPageDef } from "../SettingsMenu";
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
export const actorPages: SettingsPageDef[] = [
  {
    direction: pcOptions,
    label: "PC Options",
    description: "PcOptionsDescription",
  },
  {
    direction: personalDetails,
    label: "Personal details",
    description: "PersonalDetailsDescription",
    summary: (s) => s.personalDetails.length,
  },
  {
    direction: notesFields,
    label: "Notes Fields",
    description: "NotesFieldsDescription",
    summary: (s) => s.longNotes.length,
  },
  {
    direction: pcStats,
    label: "PC Stats",
    description: "PcStatsDescription",
    summary: (s) => Object.keys(s.pcStats).length,
  },
  {
    direction: npcStats,
    label: "NPC Stats",
    description: "NpcStatsDescription",
    summary: (s) => Object.keys(s.npcStats).length,
  },
];
