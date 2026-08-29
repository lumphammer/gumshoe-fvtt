import { describe, expect, it } from "vitest";

import { getPushPoolWarningKeys } from "./getPushPoolWarningKeys";

describe("getPushPoolWarningKeys", () => {
  it.each([
    [0, 0, []],
    [0, 1, ["QuickShockAbilityWithoutPushPool"]],
    [0, 2, ["QuickShockAbilityWithoutPushPool"]],
    [1, 0, ["PushPoolWithoutQuickShockAbility"]],
    [1, 1, []],
    [1, 2, []],
    [2, 0, ["TooManyPushPools", "PushPoolWithoutQuickShockAbility"]],
    [2, 1, ["TooManyPushPools"]],
    [2, 2, ["TooManyPushPools"]],
  ])(
    "returns the warnings for %i pools and %i QuickShock abilities",
    (poolCount, quickShockAbilityCount, expected) => {
      expect(getPushPoolWarningKeys(poolCount, quickShockAbilityCount)).toEqual(
        expected,
      );
    },
  );
});
