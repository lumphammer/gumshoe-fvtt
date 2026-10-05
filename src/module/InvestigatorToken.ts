import {
  getBarFillFraction,
  getBarTickFractions,
  getBelowZeroBarColor,
} from "./tokenBars";

type BarData = NonNullable<TokenDocument.GetBarAttributeReturn>;

function getBarMin(document: TokenDocument, index: number): number {
  const data: unknown = index === 0 ? document.bar1 : document.bar2;
  const min =
    typeof data === "object" && data !== null && "min" in data
      ? data.min
      : null;
  return typeof min === "number" ? min : 0;
}

/**
 * Foundry's bars ignore a resource's `min`, so Health stops at 0. Ours fill
 * over the whole range, and bars which go below 0 run green → amber (0) → red
 * (−6), with ticks at those thresholds.
 */
export class InvestigatorToken extends foundry.canvas.placeables.Token {
  // based on foundry's Token#_drawBar
  protected override _drawBar(
    index: number,
    bar: PIXI.Graphics,
    data: BarData,
  ): void {
    const value = Number(data.value);
    const max = Number("max" in data ? data.max : 0);
    // animation data only has value and max, so get min from the document
    const min = getBarMin(this.document, index);
    const pct = getBarFillFraction(value, min, max);

    // Determine sizing
    const { width, height } = this.document.getSize();
    const s = canvas!.dimensions!.uiScale;
    const bw = width;
    const bh = 8 * (this.document.height >= 2 ? 1.5 : 1) * s;

    // Determine the color to use
    let color: number;
    if (min < 0) {
      color = getBelowZeroBarColor(value, max);
    } else {
      const colors = this._getBarColors(index, data);
      color = foundry.utils.Color.mix(colors.empty, colors.full, pct);
    }

    // Draw the bar
    bar.clear();
    bar.lineStyle(s, 0x000000, 1.0);
    bar.beginFill(0x000000, 0.5).drawRoundedRect(0, 0, bw, bh, 3 * s);
    bar.beginFill(color, 1.0).drawRoundedRect(0, 0, pct * bw, bh, 2 * s);
    bar.endFill();

    // Mark the thresholds
    bar.lineStyle(s, 0x000000, 0.6);
    for (const tick of getBarTickFractions(min, max)) {
      bar.moveTo(tick * bw, 0).lineTo(tick * bw, bh);
    }

    // Set position
    const posY = index === 0 ? height - bh : 0;
    bar.position.set(0, posY);
  }
}
