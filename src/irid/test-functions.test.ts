import { describe, expect, test } from "vitest";

import { assertNotNull } from "../functions/utilities";
import { hslToRGB, rgbToHSL } from "./conversion-functions";
import { hslToCSSHSL, rgbToCSSRGB, rgbToHex } from "./formatting-functions";
import { cssHSLToHSL, cssRGBToRGB, hexToRGB } from "./parsing-functions";

describe("functions", function () {
  test("hexToRGB (6 digits)", function () {
    const rgb = hexToRGB("#0088ff");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("hexToRGB (8 digits)", function () {
    const rgb = hexToRGB("#0088ff7f");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a?.toFixed(1)).toEqual("0.5");
  });

  test("hexToRGB (3 digits)", function () {
    const rgb = hexToRGB("#08f");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("hexToRGB (4 digits)", function () {
    const rgb = hexToRGB("#08f8");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a?.toFixed(1)).toEqual("0.5");
  });

  test("simple rgb", function () {
    const rgb = cssRGBToRGB("rgb(0, 136, 255)");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("rgb with percent", function () {
    const rgb = cssRGBToRGB("rgb(0%, 50%, 100%)");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(127);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("rgba", function () {
    const rgb = cssRGBToRGB("rgba(0, 136, 255, 0.7)");
    assertNotNull(rgb);
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(136);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(0.7);
  });

  test("hsl", function () {
    const hsl = cssHSLToHSL("hsl(180, 60%, 70%)");
    assertNotNull(hsl);
    expect(hsl.h).toEqual(0.5);
    expect(hsl.s).toEqual(0.6);
    expect(hsl.l).toEqual(0.7);
    expect(hsl.a).toEqual(undefined);
  });

  test("hsla", function () {
    const hsl = cssHSLToHSL("hsl(180, 60%, 70%, 0.8)");
    assertNotNull(hsl);
    expect(hsl.h).toEqual(0.5);
    expect(hsl.s).toEqual(0.6);
    expect(hsl.l).toEqual(0.7);
    expect(hsl.a).toEqual(0.8);
  });

  test("rgbToCSSRGB", function () {
    expect(rgbToCSSRGB({ type: "rgba", r: 0, g: 136, b: 255 })).toEqual(
      "rgb(0, 136, 255)",
    );
  });

  test("rgbToCSSRGB with alpha", function () {
    expect(rgbToCSSRGB({ type: "rgba", r: 0, g: 136, b: 255, a: 0.7 })).toEqual(
      "rgba(0, 136, 255, 0.70)",
    );
  });

  test("hslToCSSHSL", function () {
    expect(hslToCSSHSL({ type: "hsla", h: 0.5, s: 0.6, l: 0.7 })).toEqual(
      "hsl(180, 60%, 70%)",
    );
  });

  test("hslToCSSHSL with alpha", function () {
    expect(
      hslToCSSHSL({ type: "hsla", h: 0.5, s: 0.6, l: 0.7, a: 0.8 }),
    ).toEqual("hsla(180, 60%, 70%, 0.80)");
  });

  test("rgbToHex", function () {
    expect(rgbToHex({ type: "rgba", r: 0, g: 136, b: 255 })).toEqual("#0088ff");
  });

  test("rgbToHex with alpha", function () {
    expect(rgbToHex({ type: "rgba", r: 0, g: 136, b: 255, a: 0.5 })).toEqual(
      "#0088ff7f",
    );
  });

  test("hslToRGB", function () {
    const rgb = hslToRGB({ type: "hsla", h: 147 / 255, s: 1, l: 128 / 255 });
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(138);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("hslToRGB with alpha", function () {
    const rgb = hslToRGB({
      type: "hsla",
      h: 147 / 255,
      s: 1,
      l: 128 / 255,
      a: 0.5,
    });
    expect(rgb.r).toEqual(0);
    expect(rgb.g).toEqual(138);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(0.5);
  });

  test("hslToRGB (white)", function () {
    const rgb = hslToRGB({ type: "hsla", h: 0, s: 1, l: 1 });
    expect(rgb.r).toEqual(255);
    expect(rgb.g).toEqual(255);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("hslToRGB (hue=1)", function () {
    const rgb = hslToRGB({ type: "hsla", h: 1, s: 1, l: 0.5 });
    expect(rgb.r).toEqual(255);
    expect(rgb.g).toEqual(0);
    expect(rgb.b).toEqual(0);
    expect(rgb.a).toEqual(undefined);
  });

  test("hslToRGB (negative hue)", function () {
    const rgb = hslToRGB({ type: "hsla", h: -0.25, s: 1, l: 0.5 });
    expect(rgb.r).toEqual(127);
    expect(rgb.g).toEqual(0);
    expect(rgb.b).toEqual(255);
    expect(rgb.a).toEqual(undefined);
  });

  test("rgbToHSL", function () {
    const hsl = rgbToHSL({ type: "rgba", r: 0, g: 138, b: 255 });
    expect(hsl.h.toFixed(2)).toEqual((147 / 255).toFixed(2));
    expect(hsl.s.toFixed(2)).toEqual("1.00");
    expect(hsl.l.toFixed(2)).toEqual((128 / 255).toFixed(2));
    expect(hsl.a).toEqual(undefined);
  });

  test("rgbToHSL", function () {
    const hsl = rgbToHSL({ type: "rgba", r: 0, g: 138, b: 255, a: 0.5 });
    expect(hsl.h.toFixed(2)).toEqual((147 / 255).toFixed(2));
    expect(hsl.s.toFixed(2)).toEqual("1.00");
    expect(hsl.l.toFixed(2)).toEqual((128 / 255).toFixed(2));
    expect(hsl.a).toEqual(0.5);
  });

  test("rgbToHSL (white)", function () {
    const hsl = rgbToHSL({ type: "rgba", r: 255, g: 255, b: 255 });
    expect(hsl.h.toFixed(2)).toEqual("0.00");
    expect(hsl.s.toFixed(2)).toEqual("0.00");
    expect(hsl.l.toFixed(2)).toEqual("1.00");
    expect(hsl.a).toEqual(undefined);
  });
});
