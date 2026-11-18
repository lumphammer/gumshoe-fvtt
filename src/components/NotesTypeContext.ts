import { createContext } from "react";

/** What a notes area is for. */
type NotesTypeContextData = "pcNote" | "npcNote" | "itemNote";

/**
 * Used to indicate when you render any kind of notes area, what type of notes
 * it is.
 */
export const NotesTypeContext = createContext<NotesTypeContextData | null>(
  null,
);
