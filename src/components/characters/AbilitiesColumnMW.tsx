import type { AbilityItem } from "../../module/items/exports";
import { AbilitySlugPlayMw } from "./AbilitySlugPlayMw";
import { NoAbilitiesNote } from "./NoAbilitiesNote";
import { css } from "../../styled-system/css";

interface AbilitiesColumnMWProps {
  /** The live abilities: each row reads its own through a snapshot */
  abilities: AbilityItem[];
}

export const AbilitiesColumnMW = ({ abilities }: AbilitiesColumnMWProps) => {
  return (
    <div
      className={css({
        display: "grid",
        // the name, the pool's pips, and a Push button (Quick Shock)
        gridTemplateColumns: "1fr max-content max-content",
        gridAutoRows: "min-content",
        columnGap: "0.2em",
        rowGap: "0.25em",
        alignItems: "center",
        gridColumn: "auto",
      })}
    >
      {abilities.map((ability) => (
        <AbilitySlugPlayMw key={ability.id} ability={ability} />
      ))}
      {abilities.length === 0 && <NoAbilitiesNote />}
    </div>
  );
};
