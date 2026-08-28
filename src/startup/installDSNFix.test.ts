import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assertGame: vi.fn(), set: vi.fn() }));

vi.mock("../functions/isGame", () => ({ assertGame: mocks.assertGame }));

import { installDSNFix } from "./installDSNFix";

describe("installDSNFix", () => {
  beforeEach(() => {
    mocks.assertGame.mockReset();
    mocks.set.mockReset();
  });

  it("disables both Dice So Nice simultaneous-roll settings only", async () => {
    vi.stubGlobal("game", {
      settings: {
        settings: new Map([
          ["dice-so-nice.enabledSimultaneousRollForMessage", {}],
          ["dice-so-nice.enabledSimultaneousRolls", {}],
        ]),
        set: mocks.set,
      },
    });

    await installDSNFix();

    expect(mocks.set.mock.calls).toEqual([
      ["dice-so-nice", "enabledSimultaneousRollForMessage", false],
      ["dice-so-nice", "enabledSimultaneousRolls", false],
    ]);
  });

  it("does nothing when Dice So Nice is not installed", async () => {
    vi.stubGlobal("game", {
      settings: { settings: new Map(), set: mocks.set },
    });

    await installDSNFix();

    expect(mocks.set).not.toHaveBeenCalled();
  });
});
