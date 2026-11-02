import * as c from "../constants";
import { getRatingCapsIn } from "../module/actors/pcDerived";
import type { AbilityItem } from "../module/items/exports";
import { useActorAndSettings } from "./useActorSnapshot";
import { useItemSelector } from "./useItemSnapshot";

/** The cap on an ability's rating, if any, and what it comes from */
export type RatingCap = {
  /** the lowest of its caps, or null if there are none */
  cap: number | null;
  /** what each cap comes from, to say so */
  reasons: string[];
};

/**
 * The cap on an ability's rating: from a PC's adaptations, or Sanity's cap
 * (see `getRatingCapsIn`). Follows the ability's name, its PC and the
 * settings.
 */
export function useRatingCap(ability: AbilityItem): RatingCap {
  const name = useItemSelector(ability, (snapshot) => snapshot.name);
  return useActorAndSettings(ability.actor, (actor, settings) => {
    const caps =
      actor?.type === c.pc ? getRatingCapsIn(actor, name, settings) : [];
    return {
      cap: caps.length > 0 ? Math.min(...caps.map(({ cap }) => cap)) : null,
      reasons: caps.map(({ reason }) => reason),
    };
  });
}
