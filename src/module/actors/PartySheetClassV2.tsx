import { lazy } from "react";

import { Suspense } from "../../components/Suspense";
import { systemId } from "../../constants";

import ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

const PartySheet = lazy(async () => {
  const { PartySheet } = await import("../../components/party/PartySheet");
  return {
    default: PartySheet,
  };
});

class PartySheetClassBase extends ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "actor"],
    window: {
      resizable: true,
    },
    position: {
      width: 660,
      height: 900,
    },
  };
}

const render = () => {
  return (
    <Suspense>
      <PartySheet />
    </Suspense>
  );
};

export const PartySheetClassV2 = ReactApplicationV2Mixin(
  "PartySheetClass",
  PartySheetClassBase,
  render,
);
