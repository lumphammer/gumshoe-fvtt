import { hslToRGB, rgbToHSL } from "./conversion-functions";
import { hslToCSSHSL, rgbToCSSRGB, rgbToHex } from "./formatting-functions";
import { cssHSLToHSL, cssRGBToRGB, hexToRGB } from "./parsing-functions";
import { swatches } from "./swatches";
import { Color, HSLA, isHSLA, isRGBA, RGBA } from "./types";

const invalidErrorMessage = "Invalid color specification";
const invalidInternalStateMessage = "Invalid internal state";

export class Irid {
  private constructor(initial: Color) {
    if (isRGBA(initial)) {
      this._rgb = initial;
    } else {
      this._hsl = initial;
    }
  }

  static swatches = swatches;

  /**
   * utility constructor for creating an Irid instance from a CSS color string
   */
  static create(this: void, value: string | Irid | Color): Irid {
    if (value instanceof Irid) {
      return value;
    }
    // if value is a string
    if (typeof value === "string") {
      const rgb =
        hexToRGB(value) ||
        cssRGBToRGB(value) ||
        hexToRGB(swatches[value.toLowerCase()]);
      if (rgb) {
        return new Irid(rgb);
      }
      const hsl = cssHSLToHSL(value);
      if (!hsl) {
        throw new Error(invalidErrorMessage);
      }
      return new Irid(hsl);
    }
    if (isRGBA(value) || isHSLA(value)) {
      return new Irid(value);
    }
    throw new Error(invalidErrorMessage);
  }

  _rgb: RGBA | undefined = undefined;
  _hsl: HSLA | undefined = undefined;

  get rgb(): RGBA {
    if (!this._rgb) {
      if (!this._hsl) {
        throw new Error(invalidInternalStateMessage);
      }
      this._rgb = hslToRGB(this._hsl);
    }
    return this._rgb;
  }

  get hsl(): HSLA {
    if (!this._hsl) {
      if (!this._rgb) {
        throw new Error(invalidInternalStateMessage);
      }
      this._hsl = rgbToHSL(this._rgb);
    }
    return this._hsl;
  }

  // See http://en.wikipedia.org/wiki/HSL_and_HSV#Lightness
  luma(): number {
    const rgb = this.rgb;
    return (0.3 * rgb.r + 0.59 * rgb.g + 0.11 * rgb.b) / 255;
  }

  // see http://www.w3.org/TR/WCAG/#relativeluminancedef
  relativeLuminance(): number {
    function calc(x: number) {
      const srgb = x / 255;
      return srgb <= 0.03928
        ? srgb / 12.92
        : Math.pow((srgb + 0.055) / 1.055, 2.4);
    }
    return (
      0.2126 * calc(this.rgb.r) +
      0.7152 * calc(this.rgb.g) +
      0.0722 * calc(this.rgb.b)
    );
  }

  // see http://www.w3.org/TR/WCAG20/#visual-audio-contrast
  // http://www.w3.org/TR/WCAG20/#contrast-ratiodefs
  contrastRatio(other: Irid | string): number {
    other = Irid.create(other);
    const otherLum = other.relativeLuminance();
    const thisLum = this.relativeLuminance();
    const lighter = Math.max(otherLum, thisLum);
    const darker = Math.min(otherLum, thisLum);
    return (lighter + 0.05) / (darker + 0.05);
  }

  red(): number;
  red(r: number): Irid;
  red(r?: number): number | Irid {
    return typeof r === "undefined"
      ? this.rgb.r
      : new Irid({
          type: "rgba",
          r,
          g: this.rgb.g,
          b: this.rgb.b,
          a: this.rgb.a,
        });
  }

  green(): number;
  green(g: number): Irid;
  green(g?: number): number | Irid {
    return typeof g === "undefined"
      ? this.rgb.g
      : new Irid({
          type: "rgba",
          r: this.rgb.r,
          g,
          b: this.rgb.b,
          a: this.rgb.a,
        });
  }

  blue(): number;
  blue(b: number): Irid;
  blue(b?: number): number | Irid {
    return typeof b === "undefined"
      ? this.rgb.b
      : new Irid({
          type: "rgba",
          r: this.rgb.r,
          g: this.rgb.g,
          b,
          a: this.rgb.a,
        });
  }

  hue(): number;
  hue(h: number): Irid;
  hue(h?: number): number | Irid {
    return typeof h === "undefined"
      ? this.hsl.h
      : new Irid({
          type: "hsla",
          h,
          s: this.hsl.s,
          l: this.hsl.l,
          a: this.hsl.a,
        });
  }

  saturation(): number;
  saturation(s: number): Irid;
  saturation(s?: number): number | Irid {
    return typeof s === "undefined"
      ? this.hsl.s
      : new Irid({
          type: "hsla",
          h: this.hsl.h,
          s,
          l: this.hsl.l,
          a: this.hsl.a,
        });
  }

  lightness(): number;
  lightness(l: number): Irid;
  lightness(l?: number): number | Irid {
    return typeof l === "undefined"
      ? this.hsl.l
      : new Irid({
          type: "hsla",
          h: this.hsl.h,
          s: this.hsl.s,
          l,
          a: this.hsl.a,
        });
  }

  alpha(): number;
  alpha(a: number | undefined | null): Irid;
  alpha(a?: number | null): number | Irid | undefined {
    if (arguments.length === 0) {
      const a = (this._hsl || this._rgb)?.a;
      return a;
    } else {
      if (this._hsl) {
        return new Irid({
          type: "hsla",
          h: this.hsl.h,
          s: this.hsl.s,
          l: this.hsl.l,
          a: a ?? undefined,
        });
      } else {
        return new Irid({
          type: "rgba",
          r: this.rgb.r,
          g: this.rgb.g,
          b: this.rgb.b,
          a: a ?? undefined,
        });
      }
    }
  }

  opacity(): number;
  opacity(a: number | undefined | null): Irid;
  opacity(a?: number | null): number | Irid | undefined {
    if (arguments.length === 0) {
      return this.alpha();
    } else {
      return this.alpha(a);
    }
  }

  lighten(amount: number): Irid {
    return new Irid({
      type: "hsla",
      h: this.hsl.h,
      s: this.hsl.s,
      l: this.hsl.l + (1 - this.hsl.l) * amount,
      a: this.hsl.a,
    });
  }

  darken(amount: number): Irid {
    return new Irid({
      type: "hsla",
      h: this.hsl.h,
      s: this.hsl.s,
      l: this.hsl.l - this.hsl.l * amount,
      a: this.hsl.a,
    });
  }

  invert(): Irid {
    return new Irid({
      type: "rgba",
      r: 255 - this.rgb.r,
      g: 255 - this.rgb.g,
      b: 255 - this.rgb.b,
      a: this.rgb.a,
    });
  }

  complement(): Irid {
    return new Irid({
      type: "hsla",
      h: (this.hsl.h + 0.5) % 1.0,
      s: this.hsl.s,
      l: this.hsl.l,
      a: this.hsl.a,
    });
  }

  desaturate(): Irid {
    return new Irid({
      type: "hsla",
      h: this.hsl.h,
      s: 0,
      l: this.hsl.l,
      a: this.hsl.a,
    });
  }

  contrast(a: string | Irid, b: string | Irid): Irid;
  contrast(): Irid;
  contrast(a?: string | Irid, b?: string | Irid) {
    a = Irid.create(a || "#000");
    b = Irid.create(b || "#fff");
    const aContrast = Math.abs(a.luma() - this.luma());
    const bContrast = Math.abs(b.luma() - this.luma());
    return aContrast > bContrast ? a : b;
  }

  analagous(): [Irid, Irid, Irid] {
    return [this, this.hue(this.hue() - 1 / 12), this.hue(this.hue() + 1 / 12)];
  }

  tetrad(): [Irid, Irid, Irid, Irid] {
    const hue = this.hue();
    return [
      this,
      this.hue(hue + 1 / 4),
      this.hue(hue + 2 / 4),
      this.hue(hue + 3 / 4),
    ];
  }

  rectTetrad(): [Irid, Irid, Irid, Irid] {
    return [
      this,
      this.hue(this.hue() + 1 / 6),
      this.hue(this.hue() + 3 / 6),
      this.hue(this.hue() + 4 / 6),
    ];
  }

  triad(): [Irid, Irid, Irid] {
    return [this, this.hue(this.hue() - 1 / 3), this.hue(this.hue() + 1 / 3)];
  }

  splitComplementary(): [Irid, Irid, Irid] {
    return [this, this.hue(this.hue() - 5 / 12), this.hue(this.hue() + 5 / 12)];
  }

  blend(other: Irid | string, opacity?: number): Irid {
    if (typeof opacity === "undefined") {
      opacity = 0.5;
    }
    const thisOpacity = 1 - opacity;
    other = Irid.create(other);
    return new Irid({
      type: "rgba",
      r: Math.floor(this.red() * thisOpacity + other.red() * opacity),
      g: Math.floor(this.green() * thisOpacity + other.green() * opacity),
      b: Math.floor(this.blue() * thisOpacity + other.blue() * opacity),
    });
  }

  toString() {
    // TODO: make this smarter, return rgba when needed
    return this.toHexString();
  }

  toHexString() {
    return rgbToHex(this.rgb);
  }

  toRGBString() {
    return rgbToCSSRGB(this.rgb);
  }

  toHSLString() {
    return hslToCSSHSL(this.hsl);
  }
}

/**
 * Convenience export for creating new Irid instances. identical to
 * `Irid.create`.
 */
export const irid = Irid.create;
