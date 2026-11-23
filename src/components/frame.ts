import { appFrame } from "../styled-system/recipes";
import type { Layout, SheetKind } from "../themes/theme";

type FrameOwner = {
  slug?: string;
  style: Record<string, string>;
  layout: Layout;
  sheet: SheetKind;
};

/** The themed roots claiming each window: the latest one styles it. */
const frameOwners = new WeakMap<HTMLElement, FrameOwner[]>();

const parts = ["root", "header", "content"] as const;

function frameParts(frame: HTMLElement) {
  return [
    frame,
    frame.querySelector(":scope > .window-header"),
    frame.querySelector(":scope > .window-content"),
  ] as const;
}

/** Each part's classes, for a layout and a kind of sheet. */
const partClasses = (layout: Layout, sheet: SheetKind) => {
  const classes = appFrame({ layout, sheet });
  return parts.map((part) => classes[part].split(" "));
};

/** Every part's classes, whatever the layout and sheet: to take them off. */
const allPartClasses = parts.map((_, i) => [
  ...new Set(
    (["standard", "full-frame"] as const).flatMap((layout) =>
      (["character", "item", "freeform"] as const).flatMap(
        (sheet) => partClasses(layout, sheet)[i],
      ),
    ),
  ),
]);

/**
 * Style a window for its latest owner (one that has said what with), or
 * unstyle it if it has none. `previous` is the palette it had.
 */
function applyFrame(frame: HTMLElement, previous: Record<string, string>) {
  const owner = frameOwners.get(frame)?.findLast((o) => o.slug !== undefined);
  for (const property of Object.keys(previous)) {
    frame.style.removeProperty(property);
  }
  const elements = frameParts(frame);
  elements.forEach((el, i) => el?.classList.remove(...allPartClasses[i]));
  const fullFrame = owner?.slug !== undefined && owner.layout === "full-frame";
  if (fullFrame) frame.dataset["invLayout"] = "full-frame";
  else delete frame.dataset["invLayout"];
  if (owner?.slug !== undefined) {
    const classes = partClasses(owner.layout, owner.sheet);
    elements.forEach((el, i) => el?.classList.add(...classes[i]));
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
  update: (
    slug: string,
    style: Record<string, string>,
    layout: Layout,
    sheet: SheetKind,
  ) => void;
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
  const owner: FrameOwner = {
    style: {},
    layout: "standard",
    sheet: "freeform",
  };
  frameOwners.set(frame, [...(frameOwners.get(frame) ?? []), owner]);
  return {
    update: (slug, style, layout, sheet) => {
      const previous = current(frame);
      owner.slug = slug;
      owner.style = style;
      owner.layout = layout;
      owner.sheet = sheet;
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
