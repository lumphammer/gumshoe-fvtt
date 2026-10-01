import type { Cover } from "./rules";
import {
  deadHealth,
  getWoundState,
  hurtHealth,
  seriouslyWoundedHealth,
} from "./rules";

/**
 * A Lethality rating (p. 093), e.g. `L1**HH`: a number, then any number of
 * asterisks, then any number of Hs. Modifiers stack (see the Impact rules).
 */
export type Lethality = {
  rating: number;
  asterisks: number;
  hs: number;
};

/** e.g. { rating: 1, asterisks: 2, hs: 2 } -> "L1**HH" */
export function formatLethality({ rating, asterisks, hs }: Lethality): string {
  return `L${rating}${"*".repeat(asterisks)}${"H".repeat(hs)}`;
}

/**
 * Parse the book's notation. The "L" is optional and case doesn't matter.
 * Returns null for anything we can't make sense of.
 */
export function parseLethality(text: string): Lethality | null {
  const match = /^l?(\d+)(\**)(h*)$/i.exec(text.replace(/\s/g, ""));
  if (!match) return null;
  return {
    rating: Number(match[1]),
    asterisks: match[2].length,
    hs: match[3].length,
  };
}

/**
 * Full cover between you and the attack subtracts 1 from the Lethality rating,
 * for both the roll and the damage (p. 096).
 */
export function applyCoverToLethality(
  lethality: Lethality,
  cover: Cover,
): Lethality {
  if (cover !== "full") return lethality;
  return { ...lethality, rating: Math.max(0, lethality.rating - 1) };
}

/** Which band the die falls into, before considering existing wounds */
export type LethalityBand = "kill" | "asterisk" | "h" | "damage";

export function getLethalityBand(
  { rating, asterisks, hs }: Lethality,
  die: number,
): LethalityBand {
  if (die <= rating) return "kill";
  if (die <= rating + asterisks) return "asterisk";
  if (die <= rating + asterisks + hs) return "h";
  return "damage";
}

/** What actually happened, after taking existing wounds into account */
export type LethalityOutcome = "dies" | "seriouslyWounded" | "hurt" | "damage";

export type LethalityResult = {
  band: LethalityBand;
  outcome: LethalityOutcome;
  /** 5 x rating + die, for the damage band; otherwise 0 */
  rolledDamage: number;
  armorReduction: number;
  healthAfter: number;
};

/**
 * Resolve one Lethality die against a target (p. 093 and the rules summary):
 *
 * - die <= rating: dies.
 * - each asterisk extends a band of Seriously Wounded - or dead, if already
 *   Hurt or worse.
 * - each H extends a band of Hurt - or one step worse if already wounded.
 * - above all that: 5 x rating + die damage, which armor reduces.
 *
 * Results which wound set Health to the threshold for that wound, but never
 * raise it. Targets immune to Lethality always take the damage.
 */
export function resolveLethality({
  lethality,
  die,
  healthBefore,
  armor,
  immune,
}: {
  lethality: Lethality;
  die: number;
  healthBefore: number;
  armor: number;
  immune: boolean;
}): LethalityResult {
  const band = immune ? "damage" : getLethalityBand(lethality, die);
  const state = getWoundState(healthBefore);
  const reduceTo = (health: number) => Math.min(healthBefore, health);

  const dies = (): LethalityResult => ({
    band,
    outcome: "dies",
    rolledDamage: 0,
    armorReduction: 0,
    healthAfter: reduceTo(deadHealth),
  });
  const seriouslyWounded = (): LethalityResult => ({
    band,
    outcome: "seriouslyWounded",
    rolledDamage: 0,
    armorReduction: 0,
    healthAfter: reduceTo(seriouslyWoundedHealth),
  });

  switch (band) {
    case "kill":
      return dies();
    case "asterisk":
      return state === "ok" ? seriouslyWounded() : dies();
    case "h":
      if (state === "ok") {
        return {
          band,
          outcome: "hurt",
          rolledDamage: 0,
          armorReduction: 0,
          healthAfter: reduceTo(hurtHealth),
        };
      }
      return state === "hurt" ? seriouslyWounded() : dies();
    case "damage": {
      const rolledDamage = 5 * lethality.rating + die;
      const taken = Math.max(0, rolledDamage - Math.abs(armor));
      return {
        band,
        outcome: "damage",
        rolledDamage,
        armorReduction: rolledDamage - taken,
        healthAfter: healthBefore - taken,
      };
    }
  }
}
