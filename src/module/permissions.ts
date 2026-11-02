import { assertGame } from "../functions/isGame";

/** A permission level, by name */
export type PermissionLevel = "LIMITED" | "OBSERVER" | "OWNER";

type Permissioned = {
  testUserPermission: (
    user: User.Implementation,
    level: PermissionLevel,
    options?: { exact?: boolean },
  ) => boolean;
};

/**
 * Whether the current user has at least this permission on a document (or
 * exactly it, with `exact`). False for no document. Read live, so call it in a
 * snapshot selector (`useDocumentPermission`), or an event handler, never
 * during a compiled render.
 */
export function canUser(
  doc: unknown,
  level: PermissionLevel,
  options?: { exact?: boolean },
): boolean {
  if (doc === null || doc === undefined) return false;
  assertGame(game);
  return (doc as Permissioned).testUserPermission(game.user, level, options);
}

/** Whether this app lets the user change its document */
export function getIsEditable(app: unknown): boolean {
  // (outside any app, e.g. in unit tests, there may be no `foundry` at all)
  if (app === null) return true;
  return (
    !(app instanceof foundry.applications.api.DocumentSheetV2) || app.isEditable
  );
}
