import { findPackTranslationProblems } from "@lumphammer/shared-fvtt-bits/task-core/packTranslations";
import path from "path";
import { describe, expect, it } from "vitest";

import { packTranslationsConfig } from "./packTranslations";

describe("pack translations", () => {
  it("are up to date with the packs", async () => {
    const problems = await findPackTranslationProblems(
      {
        rootPath: path.resolve(import.meta.dirname, ".."),
        publicPath: "public",
        manifestName: "system.json",
      },
      packTranslationsConfig,
    );
    expect(problems).toEqual([]);
  });
});
