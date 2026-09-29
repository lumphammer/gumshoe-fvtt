import type { HSLA, RGBA } from "./types";

export function hslToCSSHSL(hsl: HSLA) {
  return (
    "hsl" +
    (hsl.a ? "a" : "") +
    "(" +
    Math.round(hsl.h * 360) +
    ", " +
    Math.round(hsl.s * 100) +
    "%, " +
    Math.round(hsl.l * 100) +
    "%" +
    (hsl.a ? ", " + hsl.a.toFixed(2) : "") +
    ")"
  );
}

export function rgbToCSSRGB(rgb: RGBA): string {
  return (
    "rgb" +
    (rgb.a ? "a" : "") +
    "(" +
    Math.round(rgb.r) +
    ", " +
    Math.round(rgb.g) +
    ", " +
    Math.round(rgb.b) +
    (rgb.a ? ", " + rgb.a.toFixed(2) : "") +
    ")"
  );
}

export function rgbToHex(rgb: RGBA): string {
  let str =
    "#" +
    (rgb.r < 16 ? "0" : "") +
    rgb.r.toString(16) +
    (rgb.g < 16 ? "0" : "") +
    rgb.g.toString(16) +
    (rgb.b < 16 ? "0" : "") +
    rgb.b.toString(16);
  if (rgb.a !== undefined) {
    const alpha = Math.floor(rgb.a * 255);
    str += (alpha < 16 ? "0" : "") + alpha.toString(16);
  }
  return str;
}
