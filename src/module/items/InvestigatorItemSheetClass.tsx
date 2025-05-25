// import ReactDOM from "react-dom";
import { ReactApplicationMixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationMixin";
import React from "react";

import { Suspense } from "../../components/Suspense";
import { reactTemplatePath, systemId } from "../../constants";

// React stuff -----------------------------------------------------------------

const InvestigatorItemSheet = React.lazy(() =>
  import("../../components/ItemSheet").then(({ ItemSheet }) => ({
    default: ItemSheet,
  })),
);

const render = (sheet: ItemSheetClassBase) => {
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
class ItemSheetClassBase extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      classes: [systemId, "sheet", "item"],
      template: reactTemplatePath,
      width: 450,
      height: 600,
      resizable: true,
    };
  }
}

export const ItemSheetClass = ReactApplicationMixin(
  "ItemSheetClass",
  ItemSheetClassBase,
  render,
);
