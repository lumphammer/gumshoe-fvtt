import {
  FoundryAppContext,
  FoundryRenderSerialContext,
} from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { createContext, use, useContext } from "react";

import { getIsEditable } from "../module/permissions";

/** What the user may do with a sheet's document */
export type SheetPermissions = {
  /** whether they can change it (see `useIsEditable`) */
  isEditable: boolean;
  /** whether they only have Limited permission */
  isLimited: boolean;
};

/**
 * Provided by the root of every sheet, from `useSheetPermissions`. A sheet's
 * parts are memoised, so one which worked its permissions out for itself might
 * not re-render when they change; a context change reaches every part, memo
 * or no. Read it with `useIsEditable` and `useIsLimited`.
 */
export const SheetPermissionsContext = createContext<SheetPermissions | null>(
  null,
);

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
  const provided = useContext(SheetPermissionsContext);
  if (provided !== null) return provided.isEditable;
  // `app.isEditable` is live, and a compiled parent (e.g. `AsyncTextInput`)
  // may not re-render us when it changes: following Foundry's renders does.
  // Read only here, so sheets which provide the context don't re-render with
  // Foundry.
  use(FoundryRenderSerialContext);
  return getIsEditable(use(FoundryAppContext));
}

/**
 * Whether the user only has Limited permission on the sheet's document (false
 * outside a sheet which provides `SheetPermissionsContext`)
 */
export function useIsLimited(): boolean {
  return useContext(SheetPermissionsContext)?.isLimited ?? false;
}
