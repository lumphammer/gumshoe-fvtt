import { appFrame } from "../styled-system/recipes";
import type { ThemeV1 } from "../themes/types";

/**
 * CSS without Emotion's labels (`label:name;`), which aren't CSS. Only real
 * declarations, matched as Emotion does: not the same text inside a string
 * or a comment, or a selector for `label` elements.
 */
function stripLabels(css: string) {
  let out = "";
  let quote: string | null = null;
  // at the start of a declaration (or a rule)
  let atStart = true;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (quote) {
      out += char;
      if (char === "\\") out += css[++i] ?? "";
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out += css.slice(i, stop);
      i = stop - 1;
      continue;
    }
    if (atStart && /\s/.test(char)) {
      out += char;
      continue;
    }
    // Emotion's own label pattern, so `label:hover {` (a selector) isn't one
    const label = atStart
      ? /^label:\s*[^\s;{]+\s*(;|$)/.exec(css.slice(i))
      : null;
    if (label) {
      i += label[0].length - 1;
      continue;
    }
    atStart = char === ";" || char === "{" || char === "}";
    if (char === '"' || char === "'") quote = char;
    out += char;
  }
  return out;
}

/**
 * A V1 theme's `global` CSS (for `@import`ing fonts): a string, or Emotion's
 * serialised styles. Those can carry labels, and the keyframes they use
 * (`next`), which go after the styles: an `@import` has to come first.
 */
export function globalCss(global: ThemeV1["global"]) {
  if (!global) return "";
  if (typeof global === "string") return global;
  const parts: string[] = [];
  for (
    let serialized: SerializedStyles | undefined = global;
    serialized;
    serialized = serialized.next
  ) {
    parts.push(serialized.styles);
  }
  return stripLabels(parts.join("\n"));
}

/** Emotion's serialised styles, as a V1 theme's `global` can be. */
type SerializedStyles = Exclude<ThemeV1["global"], string | undefined>;

type FrameOwner = { slug?: string; style: Record<string, string> };

/** The themed roots claiming each window: the latest one styles it. */
const frameOwners = new WeakMap<HTMLElement, FrameOwner[]>();

function frameParts(frame: HTMLElement) {
  const classes = appFrame();
  return [
    [frame, classes.root],
    [frame.querySelector(":scope > .window-header"), classes.header],
    [frame.querySelector(":scope > .window-content"), classes.content],
  ] as const;
}

/**
 * Style a window for its latest owner (one that has said what with), or
 * unstyle it if it has none. `previous` is the palette it had.
 */
function applyFrame(frame: HTMLElement, previous: Record<string, string>) {
  const owner = frameOwners.get(frame)?.findLast((o) => o.slug !== undefined);
  for (const property of Object.keys(previous)) {
    frame.style.removeProperty(property);
  }
  for (const [el, className] of frameParts(frame)) {
    for (const name of className.split(" ")) {
      el?.classList.toggle(name, owner !== undefined);
    }
  }
  if (owner?.slug !== undefined) {
    frame.dataset["invFrame"] = owner.slug;
    for (const [property, value] of Object.entries(owner.style)) {
      frame.style.setProperty(property, value);
    }
  } else {
    delete frame.dataset["invFrame"];
  }
}

function current(frame: HTMLElement) {
  return (
    frameOwners.get(frame)?.findLast((o) => o.slug !== undefined)?.style ?? {}
  );
}

export type FrameClaim = {
  /** Style the window with this theme, when this claim is the latest. */
  update: (slug: string, style: Record<string, string>) => void;
  release: () => void;
};

/**
 * Claim the Foundry window around `root`, to put the `appFrame` classes, the
 * frame attribute and the palette on it (`update`), until `release`. Only for
 * the outermost themed root in a window: one inside another leaves the frame
 * to it. Roots side by side in one window (a loading fallback over a
 * suspended sheet, say) take turns, in the order they claimed it: the latest
 * styles it, and when it goes, the one before it does again. A claim keeps
 * its place when its theme changes.
 */
export function claimFrame(root: HTMLElement): FrameClaim | undefined {
  const frame = root.closest<HTMLElement>(".application");
  if (!frame || root.parentElement?.closest("[data-inv-theme]")) return;
  const owner: FrameOwner = { style: {} };
  frameOwners.set(frame, [...(frameOwners.get(frame) ?? []), owner]);
  return {
    update: (slug, style) => {
      const previous = current(frame);
      owner.slug = slug;
      owner.style = style;
      applyFrame(frame, previous);
    },
    release: () => {
      const previous = current(frame);
      frameOwners.set(
        frame,
        (frameOwners.get(frame) ?? []).filter((other) => other !== owner),
      );
      applyFrame(frame, previous);
    },
  };
}
