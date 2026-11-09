import { appFrame } from "../styled-system/recipes";
import type { Layout } from "../themes/theme";
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

type FrameOwner = {
  slug?: string;
  style: Record<string, string>;
  layout: Layout;
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

/** Each part's classes, for a layout. */
const partClasses = (layout: Layout) => {
  const classes = appFrame({ layout });
  return parts.map((part) => classes[part].split(" "));
};

/** How far the pointer goes before a press on a handle is a drag. */
const dragThreshold = 4;

/** What a press on means itself, not the window: not a drag. */
const interactive =
  "button, a, input, select, textarea, label, [draggable=true]";

const withHandles = new WeakSet<HTMLElement>();
/** Each window's drag in progress, if any: how to stop it. */
const drags = new WeakMap<HTMLElement, () => void>();

/**
 * In the full-frame layout (the `appFrame` variant), the titlebar lets clicks
 * through to the content under it, so the window is dragged by the content's
 * handles instead (`data-inv-window-handle`: the logo). A press there that
 * moves is a drag; one that doesn't is a click, so the logo's text can still
 * be edited. Once it's being edited, a press on it is the text's own, so a
 * drag selects. A double click on a handle, but not on its text, minimizes
 * the window, as one on the titlebar does. Not in a detached window, which
 * has no position of its own (it keeps the standard titlebar). A drag stops
 * if the window stops being full-frame, or the handle goes.
 */
function dragByHandle(frame: HTMLElement) {
  if (withHandles.has(frame)) return;
  withHandles.add(frame);
  const handleOf = (event: Event) => {
    if (frame.dataset["invLayout"] !== "full-frame") return null;
    if (frame.ownerDocument !== document) return null;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(interactive)) {
      return null;
    }
    const handle = target.closest<HTMLElement>("[data-inv-window-handle]");
    return handle && frame.contains(handle) ? handle : null;
  };
  const appOf = () => foundry.applications.instances.get(frame.id);

  frame.addEventListener("pointerdown", (down) => {
    if (down.button !== 0 || frame.classList.contains("minimized")) return;
    const handle = handleOf(down);
    const app = appOf();
    if (!handle || !app) return;
    // the text being edited: selecting, not dragging
    const editing = (down.target as Element).closest("[contenteditable=true]");
    if (editing?.contains(document.activeElement)) return;
    const { left, top } = app.position;
    let dragging = false;
    const listening = new AbortController();
    const stop = () => {
      listening.abort();
      if (drags.get(frame) === stop) drags.delete(frame);
      if (dragging) {
        handle.style.userSelect = "";
        if (handle.isConnected && handle.hasPointerCapture(down.pointerId)) {
          handle.releasePointerCapture(down.pointerId);
        }
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== down.pointerId) return;
      if (!handle.isConnected || frame.dataset["invLayout"] !== "full-frame") {
        stop();
        return;
      }
      const dx = event.clientX - down.clientX;
      const dy = event.clientY - down.clientY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < dragThreshold) return;
        dragging = true;
        // a drag, not an edit: no selection, no caret
        handle.setPointerCapture(down.pointerId);
        const active = document.activeElement;
        if (active instanceof HTMLElement && handle.contains(active)) {
          active.blur();
        }
        handle.style.userSelect = "none";
      }
      document.getSelection()?.removeAllRanges();
      app.setPosition({ left: left + dx, top: top + dy });
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId === down.pointerId) stop();
    };
    drags.get(frame)?.();
    drags.set(frame, stop);
    const { signal } = listening;
    document.addEventListener("pointermove", move, { signal });
    document.addEventListener("pointerup", end, { signal });
    document.addEventListener("pointercancel", end, { signal });
    handle.addEventListener(
      "lostpointercapture",
      (event) => {
        if (dragging) end(event);
      },
      { signal },
    );
  });

  frame.addEventListener("dblclick", (event) => {
    const handle = handleOf(event);
    const target = event.target as Element;
    // the name, editable or not: a double click there selects a word
    if (!handle || target.closest("[contenteditable]")) return;
    void appOf()?.minimize();
  });
}

/** The titlebar's buttons' width, on the window, while it's full-frame. */
const controlsWidth = "--inv-window-controls-width";
const measuring = new WeakMap<HTMLElement, () => void>();

/**
 * Keep `--inv-window-controls-width` on the window: how far its titlebar's
 * buttons reach in from its right edge, so a full-frame sheet can keep its
 * content clear of them. Measured again when the titlebar resizes, or gets
 * or loses a button. Returns how to stop.
 */
function measureControls(frame: HTMLElement) {
  const header = frame.querySelector<HTMLElement>(":scope > .window-header");
  const stop = () => frame.style.removeProperty(controlsWidth);
  if (!header || typeof ResizeObserver === "undefined") return stop;
  const measure = () => {
    const box = header.getBoundingClientRect();
    const right = box.right;
    // in CSS pixels, not scaled ones (the window's `position.scale`)
    const scale = header.offsetWidth > 0 ? box.width / header.offsetWidth : 1;
    const lefts = [...header.querySelectorAll(".header-control")]
      .map((control) => control.getBoundingClientRect())
      .filter((box) => box.width > 0)
      .map((box) => box.left);
    const width = lefts.length > 0 ? right - Math.min(...lefts) : 0;
    frame.style.setProperty(controlsWidth, `${Math.ceil(width / scale)}px`);
  };
  const resizes = new ResizeObserver(measure);
  const observe = () => {
    resizes.disconnect();
    resizes.observe(header);
    header
      .querySelectorAll(".header-control")
      .forEach((control) => resizes.observe(control));
  };
  const changes = new MutationObserver(() => {
    observe();
    measure();
  });
  changes.observe(header, { childList: true, subtree: true });
  observe();
  measure();
  return () => {
    resizes.disconnect();
    changes.disconnect();
    stop();
  };
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
  const elements = frameParts(frame);
  const all = [...partClasses("standard"), ...partClasses("full-frame")];
  elements.forEach((el, i) => {
    el?.classList.remove(...all[i], ...all[i + parts.length]);
  });
  const fullFrame = owner?.slug !== undefined && owner.layout === "full-frame";
  if (fullFrame) {
    frame.dataset["invLayout"] = "full-frame";
    dragByHandle(frame);
    if (!measuring.has(frame)) measuring.set(frame, measureControls(frame));
  } else {
    delete frame.dataset["invLayout"];
    drags.get(frame)?.();
    measuring.get(frame)?.();
    measuring.delete(frame);
  }
  if (owner?.slug !== undefined) {
    const classes = partClasses(owner.layout);
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
  update: (slug: string, style: Record<string, string>, layout: Layout) => void;
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
  const owner: FrameOwner = { style: {}, layout: "standard" };
  frameOwners.set(frame, [...(frameOwners.get(frame) ?? []), owner]);
  return {
    update: (slug, style, layout) => {
      const previous = current(frame);
      owner.slug = slug;
      owner.style = style;
      owner.layout = layout;
      applyFrame(frame, previous);
    },
    release: () => {
      // a drag by this root's handle stops with it
      drags.get(frame)?.();
      const previous = current(frame);
      frameOwners.set(
        frame,
        (frameOwners.get(frame) ?? []).filter((other) => other !== owner),
      );
      applyFrame(frame, previous);
    },
  };
}
