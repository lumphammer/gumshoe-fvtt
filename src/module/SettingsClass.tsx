import { ReactApplicationMixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationMixin";
import React from "react";

import { Suspense } from "../components/Suspense";
import {
  reactTemplatePath,
  settingsCloseAttempted,
  systemId,
} from "../constants";

const Settings = React.lazy(() =>
  import("../components/settings/Settings").then(({ Settings }) => ({
    default: Settings,
  })),
);

// this has to be a FormApplication so that we can "register" it as a "menu"
// in settings
export class SettingsClassBase extends FormApplication<
  FormApplicationOptions,
  // we specify the type of the "concrete" object that this FormApplication
  // is editing. In this case, we don't have a concrete object, so we
  // specify undefined. This tells the types to allow the empty constructor
  // to be used.
  undefined
> {
  // /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [systemId, "sheet", "item", "dialog"],
      template: reactTemplatePath,
      width: 700,
      height: 800,
      resizable: true,
      title: "GUMSHOE Settings",
    });
  }

  /**
   * We override close to allow us to distinguish between attempts to close the
   * window that came from the user directly, vs. attempts that came from
   * hitting the Escape key or any other method of closing the app.
   */
  async close(options?: Application.CloseOptions) {
    if (options?.approved) {
      return super.close(options);
    } else {
      Hooks.call(settingsCloseAttempted);
      throw new Error("Settings won't close yet - not approved by user");
    }
  }

  // this is here to satisfy foundry-vtt-types
  _updateObject(event: Event, formData?: any) {
    return Promise.resolve();
  }
}

const render = (sheet: SettingsClassBase) => {
  $(sheet.element).find(".header-button.close").hide();
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
};

export const SettingsClass = ReactApplicationMixin(
  "SettingsClass",
  SettingsClassBase,
  render,
);

export const investigatorSettingsClassInstance = new SettingsClass();

declare global {
  namespace Application {
    interface CloseOptions {
      /**
       * extra flag added to slose options so we can distinguish close() calls
       * that we have generated from one coming from e.g. hitting the Escape key
       */
      approved: boolean;
    }
  }
}
