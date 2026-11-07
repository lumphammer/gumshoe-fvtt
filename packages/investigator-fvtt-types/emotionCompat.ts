// A compile-time check, not part of the API: the style types here are copies
// of Emotion's, so theme modules that use Emotion can pass our styles to it
// and theirs to us. `tsc` fails if they drift apart.
import type {
  CSSInterpolation,
  CSSObject as EmotionCSSObject,
  SerializedStyles as EmotionSerializedStyles,
} from "@emotion/serialize";

import type { CSSObject, SerializedStyles, ThemeSeedV1 } from "./index";

declare const ours: CSSObject;
declare const theirs: EmotionCSSObject;
declare const seed: ThemeSeedV1;
declare const ourSerialized: SerializedStyles;
declare const theirSerialized: EmotionSerializedStyles;

export const emotionCompat: [
  EmotionCSSObject,
  CSSObject,
  CSSInterpolation,
  EmotionSerializedStyles,
  SerializedStyles,
] = [ours, theirs, seed.largeSheetRootStyle, ourSerialized, theirSerialized];
