import { memo } from "react";

import { localize } from "./functions";

export const ToolsRow = memo(function ToolsRow() {
  return (
    <nav className="combat-controls">
      {" "}
      <button
        type="button"
        className="inline-control combat-control icon fa-solid fa-chevrons-left"
        onClick={() => null}
        data-tooltip=""
        aria-label={localize("COMBAT.RoundPrev")}
      />
    </nav>
  );
});
