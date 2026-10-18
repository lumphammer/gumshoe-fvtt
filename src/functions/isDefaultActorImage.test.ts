import { describe, expect, it } from "vitest";

import { npcIcon, pcIcon } from "../constants";
import { isDefaultActorImage } from "./isDefaultActorImage";

describe("isDefaultActorImage", () => {
  it.each([
    [null, true],
    ["", true],
    ["icons/svg/mystery-man.svg", true],
    [pcIcon, true],
    [npcIcon, true],
    // with or without the leading slash
    [pcIcon.replace(/^\//, ""), true],
    ["worlds/fodg/agents/amanda.webp", false],
  ])("%s: %s", (img, expected) => {
    expect(isDefaultActorImage(img)).toBe(expected);
  });
});
