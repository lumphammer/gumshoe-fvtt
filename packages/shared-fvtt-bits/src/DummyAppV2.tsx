import "./ApplicationV2Types";

import { DeepPartial } from "fvtt-types/utils";
import { createRoot, Root } from "react-dom/client";

import { DummyComponent } from "./DummyComponent";

import ApplicationV2 = foundry.applications.api.ApplicationV2;
import AppV2Config = foundry.applications.api.ApplicationV2.Configuration;
import RenderOptions = foundry.applications.api.ApplicationV2.RenderOptions;

export class DummyAppV2 extends ApplicationV2 {
  // STATICS
  static DEFAULT_OPTIONS: DeepPartial<AppV2Config> = {
    position: {
      height: 100,
      width: 200,
    },
    window: {
      positioned: true,
      title: "DummyAppV2",
      frame: true,
    },
  };

  // PROPERTIES

  reactRoot: Root | undefined;

  // METHODS

  // From Atropos: _renderFrame only occurs once and is the most natural point
  // (given the current API) to bind the content div to your react component.
  async _renderFrame(options: DeepPartial<RenderOptions>) {
    const element = await super._renderFrame(options);
    const target = this.hasFrame
      ? element.querySelector(".window-content")
      : element;
    if (target) {
      this.reactRoot = createRoot(target);
    }
    return element;
  }

  // _renderHTML is the semantically appropriate place to render updates to the
  // HTML of the app.
  override _renderHTML() {
    console.log("DummyAppV2._renderHTML");

    this.reactRoot?.render(
      <DummyComponent>
        <div css={{ fontSize: "2em" }}>Hello from React</div>
      </DummyComponent>,
    );

    return Promise.resolve();
  }

  // XXX This override will be optional in P3
  override _replaceHTML(result: any, content: HTMLElement, options: any) {
    // nothing to do here
  }
}
