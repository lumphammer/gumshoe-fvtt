import { HSLA, RGBA } from "./types";

export function hslToRGB(hsl: HSLA): RGBA {
  const sl = hsl.s;
  const l = hsl.l;
  const v = l <= 0.5 ? l * (1.0 + sl) : l + sl - l * sl;

  let h = hsl.h % 1;
  let r, g, b, m, sv, sextant, fract, vsf, mid1, mid2;

  if (h < 0) {
    h += 1;
  }
  r = g = b = l;
  if (v > 0) {
    m = l + l - v;
    sv = (v - m) / v;
    h *= 6.0;
    sextant = Math.floor(h);
    fract = h - sextant;
    vsf = v * sv * fract;
    mid1 = m + vsf;
    mid2 = v - vsf;
    switch (sextant) {
      case 0:
        r = v;
        g = mid1;
        b = m;
        break;
      case 1:
        r = mid2;
        g = v;
        b = m;
        break;
      case 2:
        r = m;
        g = v;
        b = mid1;
        break;
      case 3:
        r = m;
        g = mid2;
        b = v;
        break;
      case 4:
        r = mid1;
        g = m;
        b = v;
        break;
      case 5:
        r = v;
        g = m;
        b = mid2;
        break;
    }
  }
  return {
    type: "rgba",
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255),
    a: hsl.a,
  };
}

export function rgbToHSL(rgb: RGBA): HSLA {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const v = Math.max(r, g, b);
  const m = Math.min(r, g, b);

  let vm;
  let r2;
  let g2;
  let b2;
  let h = 0;
  let s = 0;
  const l = (m + v) / 2;
  if (l > 0) {
    vm = v - m;
    s = vm;
    if (s > 0) {
      s = s / (l <= 0.5 ? v + m : 2 - v - m);
      r2 = (v - r) / vm;
      g2 = (v - g) / vm;
      b2 = (v - b) / vm;
      if (r === v) {
        h = g === m ? 5.0 + b2 : 1.0 - g2;
      } else if (g === v) {
        h = b === m ? 1.0 + r2 : 3.0 - b2;
      } else {
        h = r === m ? 3.0 + g2 : 5.0 - r2;
      }
      h = h / 6;
    }
  }
  return { type: "hsla", h: h % 1, s, l, a: rgb.a };
}
