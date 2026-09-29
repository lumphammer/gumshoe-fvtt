import type { HSLA, RGBA } from "./types";

export function parseHexValue(str: string): number {
  if (str.length === 1) {
    str += str;
  }
  return Math.max(0, Math.min(255, parseInt(str, 16)));
}

export function parseAlphaValue(str: string) {
  return str ? Math.max(0, Math.min(1, parseFloat(str))) : undefined;
}

export function parseHueValue(str: string): number {
  let val = parseInt(str, 10) % 360;
  if (val < 0) {
    val += 360;
  }
  return val / 360;
}

export function parseRGBValue(str: string): number {
  const percent = str.charAt(str.length - 1) === "%";
  if (percent) {
    str = str.slice(0, str.length - 1);
  }
  return Math.max(
    0,
    Math.min(255, Math.round(parseInt(str, 10) * (percent ? 2.55 : 1))),
  );
}

export function parseSLValue(str: string): number {
  return Math.max(0, Math.min(100, parseInt(str, 10))) / 100;
}

export function cssHSLToHSL(css: string): HSLA | undefined {
  const parts =
    /^hsla?\(\s*(-?\d+)\s*,\s*(-?\d+%)\s*,\s*(-?\d+%)\s*(?:,\s*(-?\d*(?:\.\d+)?)?)?\s*\)$/.exec(
      css,
    );
  return parts
    ? {
        type: "hsla",
        h: parseHueValue(parts[1]),
        s: parseSLValue(parts[2]),
        l: parseSLValue(parts[3]),
        a: parseAlphaValue(parts[4]),
      }
    : undefined;
}

export function cssRGBToRGB(css: string): RGBA | undefined {
  const parts =
    /^rgba?\(\s*(-?\d+%?)\s*,\s*(-?\d+%?)\s*,\s*(-?\d+%?)\s*(?:,\s*(-?\d*(?:\.\d+)?)?)?\s*\)$/.exec(
      css,
    );
  return parts
    ? {
        type: "rgba",
        r: parseRGBValue(parts[1]),
        g: parseRGBValue(parts[2]),
        b: parseRGBValue(parts[3]),
        a: parseAlphaValue(parts[4]),
      }
    : undefined;
}

export function hexToRGB(hex: string): RGBA | undefined {
  const parts =
    /^#([\da-f])([\da-f])([\da-f])([\da-f])?$/i.exec(hex) ||
    /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i.exec(hex);
  return parts
    ? {
        type: "rgba",
        r: parseHexValue(parts[1]),
        g: parseHexValue(parts[2]),
        b: parseHexValue(parts[3]),
        a:
          typeof parts[4] === "undefined" || parts[4] === ""
            ? undefined
            : parseHexValue(parts[4]) / 255,
      }
    : undefined;
}
