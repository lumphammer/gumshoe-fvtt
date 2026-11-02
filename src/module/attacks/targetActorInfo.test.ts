import { describe, expect, it } from "vitest";

import { getTargetActorInfoIn } from "./targetActorInfo";

const health = (pool: number, extra: object = {}) => ({
  _id: "h",
  name: "Health",
  type: "generalAbility",
  system: { pool, ...extra },
});

describe("getTargetActorInfoIn", () => {
  it("knows nothing of a missing actor", () => {
    expect(getTargetActorInfoIn(null)).toEqual({
      hitThreshold: null,
      armor: null,
      health: null,
      isHuman: false,
      immuneToLethality: false,
    });
  });

  it("reads a character's stats, flags and Health ability", () => {
    expect(
      getTargetActorInfoIn({
        type: "npc",
        system: {
          stats: { hitThreshold: 4, armor: 1 },
          isHuman: true,
          immuneToLethality: false,
        },
        items: [health(7)],
      }),
    ).toEqual({
      hitThreshold: 4,
      armor: 1,
      health: 7,
      isHuman: true,
      immuneToLethality: false,
    });
  });

  it("prefers the ability linked to Health, then falls back to the resource", () => {
    const linked = {
      _id: "l",
      name: "Toughness",
      type: "generalAbility",
      system: { pool: 3, linkToResource: true, resourceId: "health" },
    };
    expect(
      getTargetActorInfoIn({
        type: "pc",
        system: {},
        items: [health(9), linked],
      }).health,
    ).toBe(3);
    expect(
      getTargetActorInfoIn({
        type: "pc",
        system: { resources: { health: { value: 5 } } },
        items: [],
      }).health,
    ).toBe(5);
  });

  it("gives other actors no stats", () => {
    expect(
      getTargetActorInfoIn({
        type: "party",
        system: { stats: { hitThreshold: 4 }, isHuman: true },
        items: [],
      }),
    ).toMatchObject({ hitThreshold: null, health: null, isHuman: false });
  });
});
