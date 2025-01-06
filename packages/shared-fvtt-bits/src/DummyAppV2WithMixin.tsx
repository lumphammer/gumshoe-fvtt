import "./ApplicationV2Types";

import { DummyComponent } from "./DummyComponent";
import { ReactApplicationV2Mixin } from "./ReactApplicationV2Mixin";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class DummyAppV2WithMixinClassBase extends foundry.applications.api
  .ApplicationV2 {
  // /** @override */
  static DEFAULT_OPTIONS = {
    ...foundry.applications.api.ApplicationV2.DEFAULT_OPTIONS,
    position: {
      width: 800,
      height: 600,
    },
    window: {
      resizable: true,
    },
  };
}
const render = (sheet: foundry.applications.api.ApplicationV2) => {
  return <DummyComponent>Hey from mixed in code</DummyComponent>;
};

export const DummyAppV2WithMixin = ReactApplicationV2Mixin(
  "DummyAppV2WithMixin",
  DummyAppV2WithMixinClassBase,
  render,
);
