// The Fall of DELTA GREEN preset's Sanity & Stability settings (see
// src/presets.ts), for specs to start from. Specs don't import from src.

type TraumaType = {
  id: string;
  name: string;
  difficulty: number;
  adaptedDifficulty: number;
  causesSanityLoss: boolean;
  useAdaptation: boolean;
  cappedAbilities: string[];
  capsBonds: boolean;
  refreshPenalty: number;
};

/** Violence, Helplessness and the Unnatural; Violence capping these */
export function fodgTraumaTypes(violenceCapped: string[] = []): TraumaType[] {
  return [
    {
      id: "violence",
      name: "Violence",
      difficulty: 4,
      adaptedDifficulty: 2,
      causesSanityLoss: false,
      useAdaptation: true,
      cappedAbilities: violenceCapped,
      capsBonds: true,
      refreshPenalty: 0,
    },
    {
      id: "helplessness",
      name: "Helplessness",
      difficulty: 4,
      adaptedDifficulty: 2,
      causesSanityLoss: false,
      useAdaptation: true,
      cappedAbilities: [],
      capsBonds: false,
      refreshPenalty: 1,
    },
    {
      id: "unnatural",
      name: "The Unnatural",
      difficulty: 5,
      adaptedDifficulty: 5,
      causesSanityLoss: true,
      useAdaptation: false,
      cappedAbilities: [],
      capsBonds: false,
      refreshPenalty: 0,
    },
  ];
}

/**
 * Stability rules on, with trauma, but Bonds, states and Sanity off, for
 * specs to turn on. (The test world starts with the Trail of Cthulhu preset,
 * so specs mustn't rely on what that turns on.)
 */
export const stabilityRulesOn = {
  useStabilityRules: true,
  stabilityAbility: "Stability",
  useSanityRules: false,
  useStabilityStates: false,
  stabilityStates: {
    shaken: { name: "Shaken", upTo: 0 },
    shattered: { name: "Shattered", upTo: -6 },
    gone: { name: "Gone", upTo: -12 },
  },
  useTrauma: true,
  traumaTypes: fodgTraumaTypes(),
};
