import { memo } from "react";
import { PiPeaceLight } from "react-icons/pi";

import { assertGame } from "../../functions/isGame";
import { localize } from "./functions";
import { css } from "../../styled-system/css";

export const NoCombats = memo(function NoCombats() {
  assertGame(game);
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        textAlign: "center",
        color: "var(--color-text-secondary)",
      })}
    >
      <PiPeaceLight size={100} />
      <p className={css({ fontSize: "1.4em", fontWeight: "300" })}>
        {localize("investigator.NoCombat")}
      </p>
      {game.user.isGM && (
        <button
          type="button"
          className={css({
            justifySelf: "stretch",
            width: "auto",
          })}
          data-action="createCombat"
        >
          <i className="fa-solid fa-plus" inert />
          <span>{localize("COMBAT.Create")}</span>
        </button>
      )}
    </div>
  );
});
