import { describe, expect, it } from "vitest";

import { getCallingModuleId } from "./getCallingModuleId";

describe("getCallingModuleId", () => {
  it("finds the first module in a Chrome stack", () => {
    const stack = [
      "Error",
      "    at Object.installTheme (http://localhost:30000/systems/investigator/investigator.js:1:2)",
      "    at http://localhost:30000/modules/my-themes/init.js:3:4",
      "    at http://localhost:30000/modules/other/main.js:5:6",
    ].join("\n");
    expect(getCallingModuleId(stack)).toBe("my-themes");
  });

  it("finds a module in a Firefox stack, under a route prefix", () => {
    const stack = [
      "installTheme@https://example.com/foundry/systems/investigator/investigator.js:1:2",
      "@https://example.com/foundry/modules/my-themes/init.js?v=1:3:4",
    ].join("\n");
    expect(getCallingModuleId(stack)).toBe("my-themes");
  });

  it("finds nothing when no module is calling", () => {
    const stack = [
      "Error",
      "    at Object.installTheme (http://localhost:30000/systems/investigator/investigator.js:1:2)",
      "    at http://localhost:30000/worlds/my-world/script.js:3:4",
    ].join("\n");
    expect(getCallingModuleId(stack)).toBeUndefined();
    expect(getCallingModuleId(undefined)).toBeUndefined();
  });
});
