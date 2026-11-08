import { appFrame } from "../styled-system/recipes";

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
