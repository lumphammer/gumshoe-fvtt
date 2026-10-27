import { OverrideAutoDisableMixin } from "@lumphammer/shared-fvtt-bits/src/OverrideAutoDisableMixin";
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import type { DeepPartial } from "fvtt-types/utils";

import { PCSheet } from "../../components/characters/PCSheet";
import { settingsButtonAction } from "../../components/characters/useSettingsButton";
import { systemId } from "../../constants";
import { ActorSheetV2 } from "../../fvtt-exports";

type RenderOptions = foundry.applications.api.ApplicationV2.RenderOptions;

class PCSheetClassBase extends ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "actor"],
    position: {
      width: 777,
      height: 900,
    },
    window: {
      resizable: true,
    },
  };

  protected override _getFrameButtons(options: DeepPartial<RenderOptions>) {
    return [
      ...super._getFrameButtons(options),
      {
        icon: "fa-solid fa-gear",
        label: "investigator.Settings",
        action: settingsButtonAction,
      },
    ];
  }

  // the sheet shows it (not in the limited view) and handles clicks: see
  // `useSettingsButton`
  protected override async _renderFrame(options: DeepPartial<RenderOptions>) {
    const frame = await super._renderFrame(options);
    frame
      .querySelector<HTMLElement>(`[data-action="${settingsButtonAction}"]`)
      ?.style.setProperty("display", "none");
    return frame;
  }
}

const render = () => {
  return <PCSheet />;
};

export const PCSheetClass = ReactApplicationV2Mixin(
  "PCSheetClass",
  OverrideAutoDisableMixin(PCSheetClassBase),
  render,
);
