import { describe, expect, it, vi } from "vitest";

vi.mock("./isGame", () => ({ assertGame: vi.fn() }));
vi.mock("./utilities", () => ({ getDevMode: () => false }));
vi.mock("../settings/settings", () => ({
  settings: { debugTranslations: { get: () => false } },
}));

import { getTranslated, getTranslatedHtml } from "./getTranslated";

const setUp = () => {
  vi.stubGlobal("game", {
    i18n: {
      format: (key: string, values: Record<string, string>) =>
        `${key}: ${values["Name"]}`,
      has: () => true,
    },
  });
  vi.stubGlobal("foundry", {
    utils: {
      escapeHTML: (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;"),
    },
  });
};

describe("getTranslatedHtml", () => {
  it("escapes the substituted values", () => {
    setUp();
    expect(getTranslatedHtml("Delete", { Name: "<b>Bob</b> & Co" })).toBe(
      "investigator.Delete: &lt;b>Bob&lt;/b> &amp; Co",
    );
  });

  it("leaves getTranslated alone, because React escapes for itself", () => {
    setUp();
    expect(getTranslated("Delete", { Name: "<b>Bob</b> & Co" })).toBe(
      "investigator.Delete: <b>Bob</b> & Co",
    );
  });
});
