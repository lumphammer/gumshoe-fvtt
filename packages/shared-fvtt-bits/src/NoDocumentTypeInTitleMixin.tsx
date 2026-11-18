import type { Constructor } from "./types";

import DocumentSheetV2 = foundry.applications.api.DocumentSheetV2;

type DocumentSheetV2Constructor = Constructor<DocumentSheetV2.Any>;

/**
 * Wrap an existing Foundry Application class in this Mixin to change the title
 * in the application window to just the document's name (or id if name is empty
 * or missing), instead of prefixing it with the document type.
 *
 * Example:
 *
 * Before: "Player Character: Alice Applehead"
 * After: "Alice Applehead"
 *
 * See MIXINS.md.
 *
 * @param Base - The base class.
 */
export function NoDocumentTypeInTitleMixin<
  TBase extends DocumentSheetV2Constructor,
>(Base: TBase): TBase {
  class NoDocumentTypeInTitle extends Base {
    override get title() {
      const { id, name } = this.document;
      return name || id || "";
    }
  }

  return NoDocumentTypeInTitle;
}
