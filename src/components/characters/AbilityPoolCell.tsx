import { getTranslated } from "../../functions/getTranslated";
import { css } from "../../styled-system/css";

/** An ability's pool and rating, in its row ("3/4"), read out in full */
export const AbilityPoolCell = ({
  pool,
  rating,
}: {
  pool: number;
  rating: number;
}) => (
  <span className={css({ justifySelf: "end" })}>
    <span aria-hidden="true">
      {pool}/{rating}
    </span>
    <span className={css({ srOnly: true })}>
      {getTranslated("PoolOfRating", {
        Pool: String(pool),
        Rating: String(rating),
      })}
    </span>
  </span>
);
