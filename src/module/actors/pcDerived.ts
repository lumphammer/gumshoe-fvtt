// Things worked out from a PC's data: rating caps, Stability, Bonds, Health.
// Each takes the PC as a plain view of its data (a snapshot, or the live
// actor: both have `system` and `items`) and the settings to go by, so
// converted sheets can use them on snapshots (see docs/immutable-data.md) and
// the PC model can use them on itself. Keep documents out of this file.

import type { TraumaType } from "@lumphammer/investigator-fvtt-types";

import * as c from "../../constants";
import { getTranslated } from "../../functions/getTranslated";
import type { SettingsView } from "../../settings/settingsView";
import { liveSettings } from "../../settings/settingsView";
import {
  adaptedRatingCap,
  getAdaptedTypes,
  isAdapted,
} from "../bonds/adaptation";
import { compareBonds, isBondBroken } from "../bonds/rules";
import { findGeneralAbilityIn } from "../items/findGeneralAbility";
import { getSanityCap } from "../sanity/rules";
import {
  getAdaptableTraumaTypesFrom,
  getStabilityThresholds,
  isSanityOn,
} from "../stability/settings";
import type { StabilityState } from "../stability/states";
import { getStabilityState } from "../stability/states";
import { getTraumaDifficulty, getTraumaState } from "../stability/trauma";

/** An item, as a snapshot or a live document */
export type ItemView = {
  readonly _id: string | null;
  readonly name: string;
  readonly type: unknown;
  readonly system: unknown;
};

/** A PC, as a snapshot or a live actor */
export type PCView = {
  readonly system: unknown;
  readonly items: readonly ItemView[];
};

/** A number from an item's system data, or 0 */
const numberOf = (item: ItemView | undefined, key: string): number => {
  const value = (item?.system as Record<string, unknown> | undefined)?.[key];
  return typeof value === "number" ? value : 0;
};

const isAbility = (item: ItemView) =>
  item.type === c.generalAbility || item.type === c.investigativeAbility;

/**
 * The Stability ability: Bonds are spent on it and burned for it, and trauma
 * tests are made with it
 */
export function getStabilityAbilityIn<T extends ItemView>(
  items: readonly T[],
  s: SettingsView = liveSettings,
): T | undefined {
  return findGeneralAbilityIn(items, s.stabilityAbility);
}

/**
 * The Agent's Stability state (Fall of DELTA GREEN, p. 113), or null if states
 * aren't in use, or there's no Stability ability
 */
export function getStabilityStateIn(
  pc: PCView,
  s: SettingsView = liveSettings,
): StabilityState | null {
  const thresholds = getStabilityThresholds(s);
  const stability = getStabilityAbilityIn(pc.items, s);
  return thresholds && stability
    ? getStabilityState(numberOf(stability, "pool"), thresholds)
    : null;
}

const adaptationsOf = (pc: PCView): Readonly<Record<string, number>> =>
  (pc.system as { adaptations?: Record<string, number> }).adaptations ?? {};

/** Whether the Agent has adapted to a trauma type */
export function isAdaptedToIn(
  pc: PCView,
  traumaTypeId: string,
  s: SettingsView = liveSettings,
): boolean {
  return getAdaptableTraumaTypesFrom(s).some(
    (type) =>
      type.id === traumaTypeId &&
      isAdapted(adaptationsOf(pc)[traumaTypeId] ?? 0),
  );
}

/** The highest Sanity's rating can go, or null if Sanity rules are off */
export function getSanityCapIn(
  pc: PCView,
  s: SettingsView = liveSettings,
): number | null {
  if (!isSanityOn(s)) {
    return null;
  }
  const capAbility = pc.items.find(
    (item) => isAbility(item) && item.name === s.sanityCapAbility,
  );
  return getSanityCap({
    base: s.sanityCapBase,
    capAbilityRating: numberOf(capAbility, "rating"),
  });
}

/**
 * The caps on an ability's rating, with what each comes from (to say so):
 * adaptations, and Sanity's cap
 */
export function getRatingCapsIn(
  pc: PCView,
  abilityName: string,
  s: SettingsView = liveSettings,
): { cap: number; reason: string }[] {
  const caps: { cap: number; reason: string }[] = [];
  const adaptedTo = getAdaptedTypes(
    getAdaptableTraumaTypesFrom(s),
    adaptationsOf(pc),
  )
    .filter(({ cappedAbilities }) => cappedAbilities.includes(abilityName))
    .map((type) => type.name);
  if (adaptedTo.length > 0) {
    caps.push({
      cap: adaptedRatingCap,
      reason: getTranslated("AdaptedToTrauma", {
        Trauma: new Intl.ListFormat(game.i18n?.lang).format(adaptedTo),
      }),
    });
  }
  const sanityCap =
    abilityName === s.sanityAbility ? getSanityCapIn(pc, s) : null;
  if (sanityCap !== null) {
    caps.push({
      cap: sanityCap,
      reason: getTranslated("SanityCapReason", {
        Base: String(s.sanityCapBase),
        AbilityName: s.sanityCapAbility,
      }),
    });
  }
  return caps;
}

/** The cap on an ability's rating, if any: the lowest of its caps */
export function getRatingCapIn(
  pc: PCView,
  abilityName: string,
  s: SettingsView = liveSettings,
): number | null {
  const caps = getRatingCapsIn(pc, abilityName, s).map(({ cap }) => cap);
  return caps.length > 0 ? Math.min(...caps) : null;
}

/** Bonds in display order: ordinary first, then DELTA GREEN, by name */
export function getBondsIn<T extends ItemView>(items: readonly T[]): T[] {
  const isDeltaGreen = (bond: T) =>
    (bond.system as { isDeltaGreen?: boolean }).isDeltaGreen ?? false;
  return items
    .filter((item) => item.type === c.bond)
    .toSorted((a, b) =>
      compareBonds(
        { name: a.name, isDeltaGreen: isDeltaGreen(a) },
        { name: b.name, isDeltaGreen: isDeltaGreen(b) },
      ),
    );
}

/** What a Bond shows: its points, and whether they've broken it */
export function getBondPointsOf(bond: ItemView): {
  points: number;
  isBroken: boolean;
} {
  const points = numberOf(bond, "points");
  return { points, isBroken: isBondBroken(points) };
}

const healthResourceId = "health";

/**
 * The general ability which represents an actor's Health. Prefer one
 * explicitly linked to the "health" resource, but fall back to one called
 * "Health" for legacy compatibility, like the resource sync does.
 */
export function findHealthAbilityIn<T extends ItemView>(
  items: readonly T[],
): T | undefined {
  const generalAbilities = items.filter(
    (item) => item.type === c.generalAbility,
  );
  const system = (item: T) =>
    item.system as { linkToResource?: boolean; resourceId?: string };
  return (
    generalAbilities.find(
      (item) =>
        system(item).linkToResource &&
        system(item).resourceId === healthResourceId,
    ) ??
    generalAbilities.find(
      (item) => item.name.trim().toLowerCase() === healthResourceId,
    )
  );
}

/** The Difficulty of a Stability test against this trauma */
export function getTraumaTestDifficultyIn(
  pc: PCView,
  trauma: Pick<TraumaType, "id" | "difficulty" | "adaptedDifficulty">,
  s: SettingsView = liveSettings,
): number | null {
  const stability = getStabilityAbilityIn(pc.items, s);
  if (stability === undefined) {
    return null;
  }
  return getTraumaDifficulty({
    ...trauma,
    adapted: isAdaptedToIn(pc, trauma.id, s),
    state: getTraumaState(
      numberOf(stability, "pool"),
      getStabilityThresholds(s),
    ),
  });
}
