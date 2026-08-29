import { describe, expect, it } from "vitest";

import * as constants from "../constants";
import { buildAbilityCardContent } from "./buildAbilityCardContent";

const parse = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
};

describe("buildAbilityCardContent", () => {
  it("emits a single marker div with the given attributes", () => {
    const container = parse(
      buildAbilityCardContent({
        [constants.htmlDataName]: "Sense Trouble",
        [constants.htmlDataMwPool]: 3,
      }),
    );
    expect(container.children).toHaveLength(1);
    const el = container.firstElementChild!;
    expect(el.className).toBe(constants.abilityChatMessageClassName);
    expect(el.getAttribute(constants.htmlDataName)).toBe("Sense Trouble");
    expect(el.getAttribute(constants.htmlDataMwPool)).toBe("3");
  });

  it("does not let a hostile item name break out of the attribute", () => {
    const name = '"><img src=x onerror="alert(1)">';
    const container = parse(
      buildAbilityCardContent({ [constants.htmlDataName]: name }),
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.children).toHaveLength(1);
    expect(
      container.firstElementChild!.getAttribute(constants.htmlDataName),
    ).toBe(name);
  });

  it("renders nullish values as empty attributes", () => {
    const container = parse(
      buildAbilityCardContent({
        [constants.htmlDataActorId]: null,
        [constants.htmlDataTokenId]: undefined,
      }),
    );
    const el = container.firstElementChild!;
    expect(el.getAttribute(constants.htmlDataActorId)).toBe("");
    expect(el.getAttribute(constants.htmlDataTokenId)).toBe("");
  });
});
