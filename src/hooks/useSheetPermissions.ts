import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import type { PermissionLevel } from "../module/permissions";
import { canUser, getIsEditable } from "../module/permissions";
import type { SnapshotStore } from "../module/snapshots/createSnapshotStore";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import {
  getActorStore,
  getItemStore,
  getJournalEntryStore,
} from "../module/snapshots/documentStores";
import { getCompendiumConfigCounter } from "../module/snapshots/gameStores";
import { useActorSnapshot } from "./useActorSnapshot";
import type { SheetPermissions } from "./useIsEditable";
import { useSnapshot, useSnapshotSelector } from "./useSnapshot";

/** A document whose permissions a sheet follows */
type PermissionDocument =
  | Actor.Implementation
  | Item.Implementation
  | JournalEntry.Implementation;

const storeOf = (doc: PermissionDocument | null): SnapshotStore<unknown> => {
  switch (doc?.documentName) {
    case "Item":
      return getItemStore(doc);
    case "Actor":
      return getActorStore(doc);
    case "JournalEntry":
      return getJournalEntryStore(doc);
    default:
      return nullStore;
  }
};

// Permissions are read from the live document, but inside a snapshot
// selector: that runs again on every change to the document and on every
// render, so nothing keeps a stale answer. Worked out in a component instead, a
// memo keyed on the document or the app (such as React Compiler's) would,
// because neither changes identity when the ownership does.

/**
 * Something worked out from a document's permissions, kept current: it follows
 * the document's ownership, its actor's (an item on an actor has the actor's
 * permissions), and its compendium being locked or unlocked (a setting).
 */
function usePermissionSelector<R>(
  doc: PermissionDocument | null,
  select: () => R,
): R {
  // their results are in the document's: these only re-render when they change
  useActorSnapshot(
    doc?.documentName === "Item" ? doc.actor : null,
    (actor) => actor?.ownership ?? null,
  );
  useSnapshot(getCompendiumConfigCounter());
  return useSnapshotSelector(storeOf(doc), select);
}

/**
 * Whether the user has at least this permission on a document (false for no
 * document), kept current.
 */
export function useDocumentPermission(
  doc: PermissionDocument | null,
  level: PermissionLevel,
): boolean {
  return usePermissionSelector(doc, () => canUser(doc, level));
}

/**
 * What the user may do with a sheet's document, for the root of the sheet to
 * provide through `SheetPermissionsContext`.
 */
export function useSheetPermissions(doc: PermissionDocument): SheetPermissions {
  const app = useContext(FoundryAppContext);
  return usePermissionSelector(doc, () => ({
    isEditable: getIsEditable(app),
    isLimited: canUser(doc, "LIMITED", { exact: true }),
  }));
}
