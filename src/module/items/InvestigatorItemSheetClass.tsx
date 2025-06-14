import { OverrideAutoDisableMixin } from "@lumphammer/shared-fvtt-bits/src/OverrideAutoDisableMixin";
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../../components/Suspense";
import { ItemSheetV2 } from "../../fvtt-exports";

const InvestigatorItemSheet = React.lazy(() =>
  import("../../components/ItemSheet").then(({ ItemSheet }) => ({
    default: ItemSheet,
  })),
);

const render = () => {
  return (
    <Suspense>
      <InvestigatorItemSheet />
    </Suspense>
  );
};

class ItemSheetClassBase extends ItemSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["investigator"],
    position: {
      width: 450,
      height: 600,
    },
    window: {
      resizable: true,
    },
  };
}

export const ItemSheetClass = ReactApplicationV2Mixin(
  "ItemSheetClass",
  OverrideAutoDisableMixin(ItemSheetClassBase),
  render,
);
