import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../../components/Suspense";

import ItemSheetV2 = foundry.applications.sheets.ItemSheetV2;

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
  ItemSheetClassBase,
  render,
);
