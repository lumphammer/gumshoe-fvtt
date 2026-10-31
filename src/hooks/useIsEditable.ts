import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { createContext, useContext } from "react";

/**
 * Whether the sheet is editable, provided by sheets which read their document
 * through snapshots (see `useSheetPermissions`). Their parts are memoised, so
 * an input which works it out for itself may not re-render when it changes;
 * a context change reaches every input, memo or no.
 */
export const IsEditableContext = createContext<boolean | null>(null);

/** Whether this app lets the user change its document */
export function getIsEditable(app: unknown): boolean {
  // (outside any app, e.g. in unit tests, there may be no `foundry` at all)
  if (app === null) return true;
  return (
    !(app instanceof foundry.applications.api.DocumentSheetV2) || app.isEditable
  );
}

/**
 * Whether the user can change what's shown here: false in a document sheet
 * they can only look at (e.g. with Observer permission, or in a locked
 * compendium), true anywhere else.
 *
 * Inputs which change the document use this to disable themselves. (We can't
 * let Foundry disable every input in the sheet, because tabs and other
 * controls use inputs too: see `OverrideAutoDisableMixin`.)
 */
export function useIsEditable(): boolean {
  const provided = useContext(IsEditableContext);
  const app = useContext(FoundryAppContext);
  return provided ?? getIsEditable(app);
}
