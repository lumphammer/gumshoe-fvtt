import "./ApplicationV2Types";

import { DummyComponent } from "./DummyComponent";
import { ReactApplicationV2Mixin } from "./ReactApplicationV2Mixin";

// this funny syntax just aliases a deeply nested type
import ApplicationV2 = foundry.applications.api.ApplicationV2;

// a simple application class to set default options
class DummyAppV2WithMixinClassBase extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    position: {
      width: 800,
      height: 600,
    },
    window: {
      resizable: true,
    },
  };
}

// a render method
const render = () => {
  return <DummyComponent>Hey from mixed in code</DummyComponent>;
};

// wrap the base class in the mixin, giving it the render method and a name
export const DummyAppV2WithMixin = ReactApplicationV2Mixin(
  "DummyAppV2WithMixin",
  DummyAppV2WithMixinClassBase,
  render,
);
