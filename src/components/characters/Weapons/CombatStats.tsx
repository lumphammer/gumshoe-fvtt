import { memo } from "react";

import { useSettings } from "../../../hooks/useSettings";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import { css } from "../../../styled-system/css";
import { Panel } from "../../Panel";
import { InitiativeAbilityPicker } from "../InitiativeAbilityPicker";
import { StatField } from "../StatField";

/**
 * A PC's stats (e.g. Hit threshold) and initiative ability: a strip along the
 * top of the combat tab, or a column in the pools panel when there's no combat
 * tab. (An NPC's stay in its sidebar, as a stat block.)
 */
export const CombatStats = memo(function CombatStats({
  inColumn = false,
}: {
  inColumn?: boolean;
}) {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const stats = useSettings((s) => s.pcStats);

  return (
    <Panel
      className={css(
        inColumn
          ? { display: "flex", flexDirection: "column", gap: "0.5em" }
          : {
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5em 1.5em",
              marginBottom: "0.5em",
            },
      )}
    >
      {Object.keys(stats).map((key) => (
        <StatField key={key} id={key} stat={stats[key]} inline={!inColumn} />
      ))}
      <InitiativeAbilityPicker actor={actor} inline={!inColumn} />
    </Panel>
  );
});
