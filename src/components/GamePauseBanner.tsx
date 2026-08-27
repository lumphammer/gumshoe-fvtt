import { keyframes } from "@emotion/react";
import { LuSearch } from "react-icons/lu";

import BandedRing from "../assets/banded-ring.svg?react";
import CelticRing from "../assets/celtic-ring.svg?react";
import { assertGame } from "../functions/isGame";

/** How long one full revolution takes, for both rings. */
const revolutionTime = "24s";

/**
 * Size of the whole device. Foundry's own pause icon is 100px, and `#pause` is
 * a fixed 180px tall, so there isn't room to go much bigger than this.
 */
const size = "120px";

/**
 * Foundry hard-codes this colour for the "GAME PAUSED" caption, so we use it
 * for the artwork too rather than inventing a second near-white.
 */
const captionColor = "#ada7b8";

const spin = keyframes({
  to: {
    rotate: "1turn",
  },
});

/**
 * Each layer is centred on the same point and sized as a fraction of the whole
 * device. `translate` and `rotate` are independent transform properties, so the
 * centering here survives the rotation animation without us having to restate
 * it in the keyframes.
 */
const layer = {
  position: "absolute",
  top: "50%",
  left: "50%",
  translate: "-50% -50%",
  display: "block",
} as const;

const ring = {
  ...layer,
  animation: `${spin} ${revolutionTime} linear infinite`,
  // a spinner which exists to announce that nothing is happening is not worth
  // making anyone ill over
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
} as const;

/**
 * The contents of our replacement for Foundry's "game paused" banner: a celtic
 * ring turning clockwise around a banded ring turning anticlockwise, with a
 * stationary magnifying glass in the middle.
 */
export const GamePauseBanner = () => {
  assertGame(game);

  return (
    <>
      <div
        css={{
          position: "relative",
          width: size,
          height: size,
          color: captionColor,
        }}
      >
        <CelticRing
          css={{
            ...ring,
            width: "100%",
            height: "100%",
          }}
        />
        <BandedRing
          css={{
            ...ring,
            width: "82%",
            height: "82%",
            animationDirection: "reverse",
          }}
        />
        <LuSearch
          css={{
            ...layer,
            width: "52%",
            height: "52%",
          }}
        />
      </div>
      <figcaption
        css={{
          textShadow: "0 0 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        {game.i18n.localize("GAME.Paused")}
      </figcaption>
    </>
  );
};
