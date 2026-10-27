import { ImagePopout } from "../fvtt-exports";

/**
 * Click handler for rich text: pops out a clicked image, like journal pages
 * do, so a GM can show it to players. Images being edited, or marked
 * `nopopout`, are left alone.
 */
export const popOutClickedImage = (event: { target: EventTarget | null }) => {
  const target = event.target;
  if (
    !(target instanceof HTMLImageElement) ||
    !target.matches("img:not(.nopopout)") ||
    target.closest('[contenteditable="true"]')
  ) {
    return;
  }
  const src = target.getAttribute("src");
  if (!src) {
    return;
  }
  void new ImagePopout({
    src,
    window: { title: target.title || target.alt },
  }).render({ force: true });
};
