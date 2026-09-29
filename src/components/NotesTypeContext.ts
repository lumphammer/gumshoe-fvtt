import type { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";
import { createContext } from "react";

import type { Mandatory } from "../types";

/**
 * As of writing, this is "pcNote" | "npcNote" | "itemNote". It accidentally
 * allows "scopingContainer" which I could exclude but there doesn't seem much
 * need.
 */
type NotesTypeContextData = keyof Mandatory<ThemeSeedV1["notesCssClasses"]>;

/**
 * Used to indicate when you render any kind of notes area, what type of notes
 * it is.
 */
export const NotesTypeContext = createContext<NotesTypeContextData | null>(
  null,
);
