import { describe, expect, test } from "vitest";

import { irid } from "./irid";

describe("Irid", function () {
  test("from string (#fff)", function () {
    const color = irid("#fff");
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(1);
    expect(color.alpha()).toEqual(undefined);
  });

  test("from string (#FFF)", function () {
    const color = irid("#FFF");
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(1);
    expect(color.alpha()).toEqual(undefined);
  });

  test("from string (#000)", function () {
    const color = irid("#000");
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(0);
    expect(color.alpha()).toEqual(undefined);
  });

  test("from invalid string (#yyy)", function () {
    expect(() => irid("#yyy")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid color specification]`,
    );
  });

  test("from Irid object", function () {
    let color = irid("#000");
    color = irid(color);
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(0);
    expect(color.alpha()).toEqual(undefined);
  });

  test("from RGB object", function () {
    const c = irid({ type: "rgba", r: 255, g: 0, b: 0 });
    expect(c.hue()).toEqual(0);
    expect(c.saturation()).toEqual(1);
    expect(c.lightness()).toEqual(0.5);
  });

  test("from named color", function () {
    const c = irid("lightgoldenrodyellow");
    expect(c.hue().toFixed(2)).toEqual("0.17");
    expect(c.saturation().toFixed(2)).toEqual("0.80");
    expect(c.lightness().toFixed(2)).toEqual("0.90");
  });

  test("from named color (case insensitive)", function () {
    const c = irid("LightGoldenrodYellow");
    expect(c.hue().toFixed(2)).toEqual("0.17");
    expect(c.saturation().toFixed(2)).toEqual("0.80");
    expect(c.lightness().toFixed(2)).toEqual("0.90");
  });

  test("from undefined", function () {
    // @ts-expect-error "For JS users"
    expect(() => irid(undefined)).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot read properties of undefined (reading 'type')]`,
    );
  });

  test("from gibberish", function () {
    expect(() => irid("gibberish")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid color specification]`,
    );
  });

  test("from null", function () {
    // @ts-expect-error "For JS users"
    expect(() => irid(null)).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot read properties of null (reading 'type')]`,
    );
  });

  test("from NaN", function () {
    // @ts-expect-error "For JS users"
    expect(() => irid(NaN)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid color specification]`,
    );
  });

  test("from malformed hex code", function () {
    expect(() => irid("#ab")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid color specification]`,
    );
  });

  test("lighten", function () {
    let color = irid("#000").lighten(0.5);
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(0.5);
    expect(color.alpha()).toEqual(undefined);
    expect(color.toHexString()).toEqual("#7f7f7f");
    color = irid({ type: "hsla", h: 0, s: 0, l: 0.5 }).lighten(0.5);
    expect(color.lightness().toFixed(2)).toEqual("0.75");
  });

  test("darken", function () {
    const color = irid("#fff").darken(0.5);
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(0.5);
    expect(color.alpha()).toEqual(undefined);
    expect(color.toHexString()).toEqual("#7f7f7f");
  });

  test("invert", function () {
    let color = irid("#fff").invert();
    expect(color.hue()).toEqual(0);
    expect(color.saturation()).toEqual(0);
    expect(color.lightness()).toEqual(0);
    color = irid("#000").invert();
    expect(color.hue()).toEqual(0);
    expect(color.hsl.s).toEqual(0);
    expect(color.lightness()).toEqual(1);
    expect(irid("#f00").invert().toHexString()).toEqual("#00ffff");
    expect(irid("#0f0").invert().toHexString()).toEqual("#ff00ff");
    expect(irid("#00f").invert().toHexString()).toEqual("#ffff00");
    expect(irid("#ace").invert().toHexString()).toEqual("#553311");
  });

  test("complement", function () {
    let color = irid("#fff").complement();
    expect(color.hue()).toEqual(0.5);
    expect(color.hsl.s).toEqual(0);
    expect(color.lightness()).toEqual(1);
    color = irid("#000").complement();
    expect(color.hue()).toEqual(0.5);
    expect(color.hsl.s).toEqual(0);
    expect(color.lightness()).toEqual(0);
    expect(irid("#f00").complement().toHexString()).toEqual("#00ffff");
    expect(irid("#0f0").complement().toHexString()).toEqual("#ff00ff");
    expect(irid("#00f").complement().toHexString()).toEqual("#fffe00");
    expect(irid("#ace").complement().toHexString()).toEqual("#eeccaa");
  });

  test("desaturate", function () {
    let color = irid("#fff").desaturate();
    expect(color.hue()).toEqual(0);
    expect(color.hsl.s).toEqual(0);
    expect(color.lightness()).toEqual(1);
    color = irid("#000").desaturate();
    expect(color.hue()).toEqual(0);
    expect(color.hsl.s).toEqual(0);
    expect(color.lightness()).toEqual(0);
    expect(irid("#f00").desaturate().toHexString()).toEqual("#7f7f7f");
    expect(irid("#0f0").desaturate().toHexString()).toEqual("#7f7f7f");
    expect(irid("#00f").desaturate().toHexString()).toEqual("#7f7f7f");
    expect(irid("#ace").desaturate().toHexString()).toEqual("#cccccc");
  });

  test("contrast defaults", function () {
    let color = irid("#fff").contrast();
    expect(color.toString()).toEqual("#000000");
    color = irid("#000").contrast();
    expect(color.toString()).toEqual("#ffffff");
  });

  test("contrast with given light/dark values", function () {
    let color = irid("#fff").contrast("#dddddd", "#222222");
    expect(color.toString()).toEqual("#222222");
    color = irid("#000").contrast("#dddddd", "#222222");
    expect(color.toString()).toEqual("#dddddd");
  });

  test("contrast with pathologically dumb values", function () {
    const color = irid("#aaaaaa").contrast("#ffffff", "#aaaaaa");
    expect(color.toString()).toEqual("#ffffff");
  });

  test("contrast uses luma", function () {
    let color = irid("#3531ff").contrast();
    expect(color.toString()).toEqual("#ffffff");
    color = irid("#d8ec00").contrast();
    expect(color.toString()).toEqual("#000000");
  });

  test("get red", function () {
    const color = irid("#3531ff");
    expect(color.red()).toEqual(0x35);
  });

  test("get blue", function () {
    const color = irid("#3531ff");
    expect(color.blue()).toEqual(0xff);
  });

  test("get green", function () {
    const color = irid("#3531ff");
    expect(color.green()).toEqual(0x31);
  });

  test("set red", function () {
    const color = irid("#3531ff");
    expect(color.red(128).toString()).toEqual("#8031ff");
  });

  test("set blue", function () {
    const color = irid("#3531ff");
    expect(color.blue(128).toString()).toEqual("#353180");
  });

  test("set green", function () {
    const color = irid("#3531ff");
    expect(color.green(128).toString()).toEqual("#3580ff");
  });
  test("get hue", function () {
    const color = irid("#3531ff");
    expect(color.hue().toFixed(2)).toEqual("0.67");
  });

  test("get saturation", function () {
    const color = irid("#3531ff");
    expect(color.saturation()).toEqual(1);
  });

  test("get lightness", function () {
    const color = irid("#3531ff");
    expect(color.lightness().toFixed(2)).toEqual("0.60");
  });

  test("set hue", function () {
    const color = irid("#3531ff");
    expect(color.hue(0.5).toString()).toEqual("#30ffff");
  });

  test("set saturation", function () {
    const color = irid("#3531ff");
    expect(color.saturation(0.5).toString()).toEqual("#6664cb");
  });

  test("set lightness", function () {
    const color = irid("#3531ff");
    expect(color.lightness(0.5).toString()).toEqual("#0400ff");
  });

  test("get alpha", function () {
    const color = irid("#ffffff80");
    expect(color.alpha().toFixed(2)).toEqual("0.50");
  });

  test("set alpha", function () {
    const color = irid("#ffffff").alpha(0.5);
    expect(color.toString()).toEqual("#ffffff7f");
  });

  test("set alpha to null", function () {
    const color = irid("#ffffff55").alpha(null);
    expect(color.toString()).toEqual("#ffffff");
  });

  test("set alpha to undefined", function () {
    const color = irid("#ffffff55").alpha(undefined);
    expect(color.toString()).toEqual("#ffffff");
  });

  test("undefined alpha returned correctly", function () {
    expect(irid("#ffffff").alpha()).toEqual(undefined);
  });

  test("get opacity", function () {
    const color = irid("#ffffff80");
    expect(color.opacity().toFixed(2)).toEqual("0.50");
  });

  test("set opacity", function () {
    const color = irid("#ffffff").opacity(0.5);
    expect(color.toString()).toEqual("#ffffff7f");
  });

  test("set opacity to null", function () {
    const color = irid("#ffffff55").opacity(null);
    expect(color.toString()).toEqual("#ffffff");
  });

  test("set opacity to undefined", function () {
    const color = irid("#ffffff55").opacity(undefined);
    expect(color.toString()).toEqual("#ffffff");
  });

  test("undefined opacity returned correctly", function () {
    expect(irid("#ffffff").opacity()).toEqual(undefined);
  });

  test("analagous colors", function () {
    const c = irid("red");
    const anal = c.analagous();
    expect(anal.length).toEqual(3);
    expect(anal[0].toString()).toEqual("#ff0000");
    expect(anal[1].toString()).toEqual("#ff007f");
    expect(anal[2].toString()).toEqual("#ff7f00");
  });

  test("tetradic colors", function () {
    const c = irid("red");
    const tet = c.tetrad();
    expect(tet.length).toEqual(4);
    expect(tet[0].toString()).toEqual("#ff0000");
    expect(tet[1].toString()).toEqual("#7fff00");
    expect(tet[2].toString()).toEqual("#00ffff");
    expect(tet[3].toString()).toEqual("#7f00ff");
  });

  test("rectangular tetradic colors", function () {
    const c = irid("red");
    const tet = c.rectTetrad();
    expect(tet.length).toEqual(4);
    expect(tet[0].toString()).toEqual("#ff0000");
    expect(tet[1].toString()).toEqual("#ffff00");
    expect(tet[2].toString()).toEqual("#00ffff");
    expect(tet[3].toString()).toEqual("#0000ff");
  });

  test("triadic colors", function () {
    const c = irid("red");
    const tri = c.triad();
    expect(tri.length).toEqual(3);
    expect(tri[0].toString()).toEqual("#ff0000");
    expect(tri[1].toString()).toEqual("#0000ff");
    expect(tri[2].toString()).toEqual("#00ff00");
  });

  test("split complementary colors", function () {
    const c = irid("red");
    const comp = c.splitComplementary();
    expect(comp.length).toEqual(3);
    expect(comp[0].toString()).toEqual("#ff0000");
    expect(comp[1].toString()).toEqual("#007fff");
    expect(comp[2].toString()).toEqual("#00ff7f");
  });

  test("blending", function () {
    const white = irid("white");
    const black = irid("black");
    const blend = white.blend(black);
    expect(blend.toString()).toEqual("#7f7f7f");
  });

  test("blending with opacity 0.25", function () {
    const white = irid("white");
    const black = irid("black");
    const blend = white.blend(black, 0.25);
    expect(blend.toString()).toEqual("#bfbfbf");
  });

  test("blending with opacity 0.75", function () {
    const white = irid("white");
    const black = irid("black");
    const blend = white.blend(black, 0.75);
    expect(blend.toString()).toEqual("#3f3f3f");
  });

  test("luma calculation", function () {
    expect(irid("#fff").luma().toFixed(2)).toEqual("1.00");
    expect(irid("#f00").luma().toFixed(2)).toEqual("0.30");
    expect(irid("#0f0").luma().toFixed(2)).toEqual("0.59");
    expect(irid("#00f").luma().toFixed(2)).toEqual("0.11");
    expect(irid("#ff0").luma().toFixed(2)).toEqual("0.89");
    expect(irid("#0ff").luma().toFixed(2)).toEqual("0.70");
    expect(irid("#f0f").luma().toFixed(2)).toEqual("0.41");
  });

  test("relative luminance", function () {
    expect(irid("#fff").relativeLuminance().toFixed(2)).toEqual("1.00");
    expect(irid("#000").relativeLuminance().toFixed(2)).toEqual("0.00");
    expect(irid("#f00").relativeLuminance().toFixed(2)).toEqual("0.21");
    expect(irid("#0f0").relativeLuminance().toFixed(2)).toEqual("0.72");
    expect(irid("#00f").relativeLuminance().toFixed(2)).toEqual("0.07");
    expect(irid("#ff0").relativeLuminance().toFixed(2)).toEqual("0.93");
    expect(irid("#0ff").relativeLuminance().toFixed(2)).toEqual("0.79");
    expect(irid("#f0f").relativeLuminance().toFixed(2)).toEqual("0.28");
    expect(irid("#08f").relativeLuminance().toFixed(2)).toEqual("0.25");
  });

  test("contrast ratio", function () {
    expect(irid("#fff").contrastRatio("#000").toFixed(2)).toEqual("21.00");
    expect(irid("#000").contrastRatio("#fff").toFixed(2)).toEqual("21.00");
    expect(irid("#f00").contrastRatio("#000").toFixed(2)).toEqual("5.25");
    expect(irid("#0f0").contrastRatio("#000").toFixed(2)).toEqual("15.30");
    expect(irid("#00f").contrastRatio("#000").toFixed(2)).toEqual("2.44");
    expect(irid("#f00").contrastRatio("#fff").toFixed(2)).toEqual("4.00");
    expect(irid("#0f0").contrastRatio("#fff").toFixed(2)).toEqual("1.37");
    expect(irid("#00f").contrastRatio("#fff").toFixed(2)).toEqual("8.59");
    expect(irid("#08f").contrastRatio("#fff").toFixed(2)).toEqual("3.52");
  });

  test("bug: luma calculation on numbers that haven't been RGB initialised", function () {
    expect(irid("hsl(180, 50%, 0%)").luma()).toEqual(0);
  });
});
