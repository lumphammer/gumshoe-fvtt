import { useDocumentPermission } from "./useSheetPermissions";
import { useDocumentSheetContext } from "./useSheetContexts";

/**
 * Whether the current user owns the sheet's document, kept current (see
 * `useDocumentPermission`).
 *
 * If we ever need to use this in a non-document-sheet context, it would
 * probably be better to create a new react context
 */
export function useIsDocumentOwner() {
  const { doc } = useDocumentSheetContext();
  return useDocumentPermission(
    doc as Actor.Implementation | Item.Implementation,
    "OWNER",
  );
}
