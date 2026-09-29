// we're using a lot of empty functions here because we're testing
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, expect, test } from "vitest";

import { getFlaggedMigrations } from "./getFlaggedMigrations";
import type { FlaggedMigrations, MigrationFlags } from "./types";

const emptyFlaggedMigrations: FlaggedMigrations = {
  item: {},
  actor: {},
  world: {},
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

const sampleFlaggedMigrations: FlaggedMigrations = {
  item: {
    itemMigration1: () => {},
    itemMigration2: () => {},
  },
  actor: {
    actorMigration1: () => {},
    actorMigration2: () => {},
  },
  world: {
    worldMigration1: () => {},
    worldMigration2: () => {},
  },
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

const sampleMigrationFlags1: MigrationFlags = {
  item: {
    itemMigration1: true,
    itemMigration2: false,
  },
  actor: {
    actorMigration1: true,
    actorMigration2: false,
  },
  world: {
    worldMigration1: true,
    worldMigration2: false,
  },
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

const sampleMigrationFlags2: MigrationFlags = {
  item: {
    itemMigration1: false,
    itemMigration2: false,
  },
  actor: {
    actorMigration1: false,
    actorMigration2: false,
  },
  world: {
    worldMigration1: false,
    worldMigration2: false,
  },
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

const sampleMigrationFlags3: MigrationFlags = {
  item: {
    itemMigration1: true,
    itemMigration2: true,
  },
  actor: {
    actorMigration1: true,
    actorMigration2: true,
  },
  world: {
    worldMigration1: true,
    worldMigration2: true,
  },
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

const result1: [boolean, FlaggedMigrations, MigrationFlags] = [
  true,
  {
    item: {
      itemMigration2: sampleFlaggedMigrations.item["itemMigration2"],
    },
    actor: {
      actorMigration2: sampleFlaggedMigrations.actor["actorMigration2"],
    },
    world: {
      worldMigration2: sampleFlaggedMigrations.world["worldMigration2"],
    },
    compendium: {},
    journal: {},
    macro: {},
    scene: {},
    rollTable: {},
    playlist: {},
  },
  sampleMigrationFlags3,
];

const emptyMigrationFlags: MigrationFlags = {
  item: {},
  actor: {},
  world: {},
  compendium: {},
  journal: {},
  macro: {},
  scene: {},
  rollTable: {},
  playlist: {},
};

describe("getFlaggedMigrations", () => {
  test.each<
    [
      string,
      MigrationFlags,
      FlaggedMigrations,
      [boolean, FlaggedMigrations, MigrationFlags],
    ]
  >([
    [
      "Empty everything",
      emptyMigrationFlags,
      emptyFlaggedMigrations,
      [false, emptyFlaggedMigrations, emptyMigrationFlags],
    ],
    [
      "No flags set",
      emptyMigrationFlags,
      sampleFlaggedMigrations,
      [true, sampleFlaggedMigrations, sampleMigrationFlags3],
    ],
    ["Some flagged", sampleMigrationFlags1, sampleFlaggedMigrations, result1],
    [
      "All flags false",
      sampleMigrationFlags2,
      sampleFlaggedMigrations,
      [true, sampleFlaggedMigrations, sampleMigrationFlags3],
    ],
    [
      "All flags true",
      sampleMigrationFlags3,
      sampleFlaggedMigrations,
      [false, emptyFlaggedMigrations, sampleMigrationFlags3],
    ],
  ])("%s", (_, migrationFlags, flaggedMigrations, expected) => {
    const result = getFlaggedMigrations(migrationFlags, flaggedMigrations);
    expect(result).toEqual(expected);
  });
});
