// import ReactDOM from "react-dom";
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../components/Suspense";

// React stuff -----------------------------------------------------------------

const InvestigatorItemSheet = React.lazy(() =>
  import("../components/ItemSheet").then(({ ItemSheet }) => ({
    default: ItemSheet,
  })),
);

const render = (sheet: ItemSheetV2ClassBase) => {
  return (
    <Suspense>
      <InvestigatorItemSheet />
    </Suspense>
  );
};

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class ItemSheetV2ClassBase extends foundry.applications.sheets
  .ItemSheetV2<Item> {
  /** @override */
  static DEFAULT_OPTIONS = {
    ...foundry.applications.api.ApplicationV2.DEFAULT_OPTIONS,
    position: {
      width: 450,
      height: 600,
    },
    window: {
      resizable: true,
    },
  };
}

export const ItemSheetV2Class = ReactApplicationV2Mixin(
  "ItemSheetV2Class",
  ItemSheetV2ClassBase,
  render,
);
