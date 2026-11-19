import { OverrideAutoDisableMixin } from "@lumphammer/shared-fvtt-bits/src/OverrideAutoDisableMixin";
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import type { DeepPartial } from "fvtt-types/utils";
import React from "react";

import { Suspense } from "../../components/Suspense";
import {
  hideSettingsButton,
  settingsFrameButton,
} from "../../components/useSettingsButton";
import { ItemSheetV2 } from "../../fvtt-exports";
import { NoDocumentTypeInTitleMixin } from "@lumphammer/shared-fvtt-bits/src/NoDocumentTypeInTitleMixin";

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

type RenderOptions = foundry.applications.api.ApplicationV2.RenderOptions;

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

  protected override _getFrameButtons(options: DeepPartial<RenderOptions>) {
    return [...super._getFrameButtons(options), settingsFrameButton];
  }

  // the sheets with a config mode show it (not to Limited users) and handle
  // clicks: see `ItemSheetFramework`, `useSettingsButton`
  protected override async _renderFrame(options: DeepPartial<RenderOptions>) {
    const frame = await super._renderFrame(options);
    hideSettingsButton(frame);
    return frame;
  }
}

export const ItemSheetClass = ReactApplicationV2Mixin(
  "ItemSheetClass",
  NoDocumentTypeInTitleMixin(OverrideAutoDisableMixin(ItemSheetClassBase)),
  render,
  // every item sheet reads everything through snapshots, ownership included
  // (docs/immutable-data.md), so Foundry's re-renders needn't reach React
  { rerenderOnFoundryRender: false },
);
