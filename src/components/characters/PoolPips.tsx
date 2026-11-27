import { cx } from "../../styled-system/css";
import { poolPips } from "../../styled-system/recipes";

/** Beyond this many, pips are too many to count at a glance */
const maxPips = 12;

/**
 * A pool as pips: one per point of its rating, filled for the points left
 * (and more if the pool is over its rating). Nothing for a rating of 0, or
 * one too big to count. Only to look at: the number beside it is read out.
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
  if (count <= 0 || count > maxPips) return <span className={className} />;
  return (
    <span aria-hidden="true" className={cx(poolPips().root, className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={poolPips({ filled: i < pool }).pip} />
      ))}
    </span>
  );
};
