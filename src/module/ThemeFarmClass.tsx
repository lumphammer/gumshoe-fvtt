import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { systemId } from "../constants";
import { ApplicationV2 } from "../fvtt-exports";
import { ThemeFarm } from "../themes/components/ThemeFarm";

class ThemeFarmClassBase extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "item", "dialog"],
    position: {
      width: window.innerWidth,
      height: window.innerHeight,
      top: 0,
      left: 0,
    },
    window: {
      resizable: true,
      title: "Theme Farm",
    },
  };
}

const render = () => {
  return <ThemeFarm />;
};

export const ThemeFarmClass = ReactApplicationV2Mixin(
  "ThemeFarmClass",
  ThemeFarmClassBase,
  render,
);

export const themeFarmClassInstance = new ThemeFarmClass();
