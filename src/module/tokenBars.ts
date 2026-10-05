/**
 * Pure maths for token resource bars which honour their minimum, so Health can
 * show all the way down to −12. The Foundry side is `InvestigatorToken`.
 */

/** Foundry's bar1 "full" colour */
export const barGreen = 0x7fff00;
/** At 0: Hurt */
export const barAmber = 0xffbf00;
/** Foundry's bar1 "empty" colour; at −6 (Seriously Wounded) and below */
export const barRed = 0xff0000;

/** The GUMSHOE thresholds marked on bars which go below 0 */
export const barThresholds = [0, -6];

/** How full a bar should be, from 0 to 1, over its whole range */
export function getBarFillFraction(
  value: number,
  min: number,
  max: number,
): number {
  const range = max - min;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / range));
}

/** Mix two RGB colours channel by channel, like Foundry's `Color.mix` */
export function mixColors(from: number, to: number, weight: number): number {
  const channel = (shift: number) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a * (1 - weight) + b * weight) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}

/**
 * The colour of a bar which goes below 0: green at max, amber at 0, red at −6
 * and below.
 */
export function getBelowZeroBarColor(value: number, max: number): number {
  if (value > 0) {
    if (max <= 0 || value >= max) return barGreen;
    return mixColors(barAmber, barGreen, value / max);
  }
  const redAt = barThresholds[1];
  if (value <= redAt) return barRed;
  return mixColors(barAmber, barRed, value / redAt);
}

/** Where to draw threshold ticks, as fractions of the bar's width */
export function getBarTickFractions(min: number, max: number): number[] {
  return barThresholds
    .filter((threshold) => threshold > min && threshold < max)
    .map((threshold) => getBarFillFraction(threshold, min, max));
}
