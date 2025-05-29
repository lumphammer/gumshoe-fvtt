import React from "react";

import { Suspense } from "../components/Suspense";
import { settingsCloseAttempted, systemId } from "../constants";

import ApplicationV2 = foundry.applications.api.ApplicationV2;
import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import { DeepPartial } from "fvtt-types/utils";

const Settings = React.lazy(() =>
  import("../components/settings/Settings").then(({ Settings }) => ({
    default: Settings,
  })),
);

// this has to be a FormApplication so that we can "register" it as a "menu"
// in settings
export class SettingsClassBase extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "item", "dialog"],
    position: {
      width: 700,
      height: 800,
    },
    window: {
      resizable: true,
      title: "GUMSHOE Settings",
    },
  };

  /**
   * We override close to allow us to distinguish between attempts to close the
   * window that came from the user directly, vs. attempts that came from
   * hitting the Escape key or any other method of closing the app.
   */
  async close(options?: DeepPartial<ApplicationV2.ClosingOptions>) {
    if (options?.submitted) {
      return super.close(options);
    } else {
      Hooks.call(settingsCloseAttempted);
      throw new Error("Settings won't close yet - not approved by user");
    }
  }
}

const render = () => {
  // $(sheet.element).find(".header-button.close").hide();
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
};

export class SettingsClass extends ReactApplicationV2Mixin(
  "SettingsClass",
  SettingsClassBase,
  render,
) {}

export const investigatorSettingsClassInstance = new SettingsClass();
