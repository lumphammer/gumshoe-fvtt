/**
 * The one `tone` vocabulary every catalogue class uses. `accent` isn't a tone:
 * it means "selected" or "call to action", which are states and kinds.
 */
export const tones = [
  "neutral",
  "danger",
  "warning",
  "success",
  "info",
] as const;

export type Tone = (typeof tones)[number];
