import type { ThemeStyle } from "@lumphammer/investigator-fvtt-types";

/**
 * Properties whose numbers have no unit; any other number is pixels, as in
 * React's `style`. (React's own list.)
 */
const unitless = new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
]);

const declaration = (key: string, value: string | number) => {
  const custom = key.startsWith("--");
  const property = custom
    ? key
    : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const px =
    typeof value === "number" && value !== 0 && !custom && !unitless.has(key);
  return `${property}: ${value}${px ? "px" : ""};`;
};

/**
 * A style's declarations, then its nested rules, written as CSS nesting has
 * them: the browser works out what `&` is. A list of values is fallbacks,
 * one declaration each, so a browser keeps the last it understands.
 */
export function styleCss(style: ThemeStyle): string {
  const declarations: string[] = [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      declarations.push(...value.map((each) => declaration(key, each)));
    } else if (typeof value === "object") {
      nested.push(`${key} { ${styleCss(value as ThemeStyle)} }`);
    } else {
      declarations.push(declaration(key, value));
    }
  }
  return [...declarations, ...nested].join(" ");
}
