import { describe, expect, it } from "vitest";

import {
  barAmber,
  barGreen,
  barRed,
  getBarFillFraction,
  getBarTickFractions,
  getBelowZeroBarColor,
  mixColors,
} from "./tokenBars";

describe("getBarFillFraction", () => {
  it("fills over the whole range", () => {
    expect(getBarFillFraction(8, -12, 8)).toBe(1);
    expect(getBarFillFraction(0, -12, 8)).toBe(0.6);
    expect(getBarFillFraction(-12, -12, 8)).toBe(0);
  });

  it("matches Foundry when the minimum is 0", () => {
    expect(getBarFillFraction(3, 0, 6)).toBe(0.5);
  });

  it("clamps values outside the range", () => {
    expect(getBarFillFraction(-20, -12, 8)).toBe(0);
    expect(getBarFillFraction(-7, 0, 6)).toBe(0);
    expect(getBarFillFraction(10, -12, 8)).toBe(1);
  });

  it("is empty when the range is empty", () => {
    expect(getBarFillFraction(0, 0, 0)).toBe(0);
  });
});

describe("mixColors", () => {
  it("mixes each channel linearly", () => {
    expect(mixColors(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(mixColors(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(mixColors(0xff0000, 0x0000ff, 0.5)).toBe(0x800080);
  });
});

describe("getBelowZeroBarColor", () => {
  it("is green at max", () => {
    expect(getBelowZeroBarColor(8, 8)).toBe(barGreen);
  });

  it("is amber at 0 (Hurt)", () => {
    expect(getBelowZeroBarColor(0, 8)).toBe(barAmber);
  });

  it("is red at −6 (Seriously Wounded) and below", () => {
    expect(getBelowZeroBarColor(-6, 8)).toBe(barRed);
    expect(getBelowZeroBarColor(-12, 8)).toBe(barRed);
  });

  it("blends between the steps", () => {
    expect(getBelowZeroBarColor(4, 8)).toBe(mixColors(barAmber, barGreen, 0.5));
    expect(getBelowZeroBarColor(-3, 8)).toBe(mixColors(barAmber, barRed, 0.5));
  });

  it("copes with a max of 0 or less", () => {
    expect(getBelowZeroBarColor(0, 0)).toBe(barAmber);
    expect(getBelowZeroBarColor(1, 0)).toBe(barGreen);
  });
});

describe("getBarTickFractions", () => {
  it("marks 0 and −6 when they're inside the range", () => {
    expect(getBarTickFractions(-12, 8)).toEqual([0.6, 0.3]);
  });

  it("leaves out thresholds at or beyond the ends", () => {
    expect(getBarTickFractions(-5, 5)).toEqual([0.5]);
    expect(getBarTickFractions(0, 6)).toEqual([]);
  });
});
