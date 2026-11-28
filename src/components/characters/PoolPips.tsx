import { getTranslated } from "../../functions/getTranslated";
import { css, cx } from "../../styled-system/css";
import { poolPips } from "../../styled-system/recipes";

/** Beyond this many, pips are too many to count at a glance */
const maxPips = 12;

/**
 * A pool as pips: one per point of its rating, hollow for the points spent
 * then filled for the points left (and more if the pool is over its rating).
 * One struck through for a rating of 0, and the numbers ("9/14") for one too
 * big to count, or below zero ("-3/8": pips can't show how far). Read out in
 * words.
 */
export const PoolPips = ({
  pool,
  rating,
  className,
}: {
  pool: number;
  rating: number;
  className?: string;
}) => {
  const count = Math.max(pool, rating);
  return (
    <span className={cx(poolPips().root, className)}>
      {count > maxPips || pool < 0 ? (
        <span aria-hidden="true">
          {pool}/{rating}
        </span>
      ) : count <= 0 ? (
        // a rating of 0: one pip, struck through
        <span aria-hidden="true" className={poolPips({ point: "none" }).pip} />
      ) : (
        Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            // spent first, then the points left, against the row's end
            className={
              poolPips({ point: i >= count - pool ? "left" : "spent" }).pip
            }
          />
        ))
      )}
      <span className={css({ srOnly: true })}>
        {getTranslated("PoolOfRating", {
          Pool: String(pool),
          Rating: String(rating),
        })}
      </span>
    </span>
  );
};
