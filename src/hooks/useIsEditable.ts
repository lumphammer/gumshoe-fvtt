import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

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
  const app = useContext(FoundryAppContext);
  // (outside any app, e.g. in unit tests, there may be no `foundry` at all)
  if (app === null) return true;
  return (
    !(app instanceof foundry.applications.api.DocumentSheetV2) || app.isEditable
  );
}
