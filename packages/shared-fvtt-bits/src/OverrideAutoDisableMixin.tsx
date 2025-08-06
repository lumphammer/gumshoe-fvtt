import { Constructor } from "./types";

import DocumentSheetV2 = foundry.applications.api.DocumentSheetV2;

type DocumentSheetV2Constructor = Constructor<DocumentSheetV2.Any>;

/**
 * Wrap an existing Foundry Application class in this Mixin to override the
 * normal rendering behaviour and and use React instead.
 *
 * See MIXINS.md.
 *
 * @param Base - The base class.
 */
export function OverrideAutoDisableMixin<
  TBase extends DocumentSheetV2Constructor,
>(Base: TBase): TBase {
  class OverrideAutoDisable extends Base {
    /**
     * Override the normal behaviour of the DocumentSheetV2#_toggleDisabled
     * method to do nothing. This is needed because the normal behaviour is to
     * disable all form elements when the sheet is not editable, but 1. it
     * breaks interactions that use inputs, and 2. while it works at the moment,
     * we may in future detach the React rendering from the DocumentSheetV2
     * rendering lifecycle.
     */
    override _toggleDisabled(disabled: boolean) {
      // do nothing
    }
  }

  return OverrideAutoDisable;
}
