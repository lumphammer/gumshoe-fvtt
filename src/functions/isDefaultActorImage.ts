import { npcIcon, pcIcon } from "../constants";

const defaultActorImages = [
  // Foundry's own default
  "icons/svg/mystery-man.svg",
  pcIcon,
  npcIcon,
].map((img) => img.replace(/^\//, ""));

/**
 * Whether an actor's image is one it was given by default, rather than one
 * someone chose. (Paths may or may not have a leading slash.)
 */
export function isDefaultActorImage(img: string | null | undefined): boolean {
  return !img || defaultActorImages.includes(img.replace(/^\//, ""));
}
