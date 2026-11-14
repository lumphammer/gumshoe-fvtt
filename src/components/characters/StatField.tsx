import type { Stat } from "@lumphammer/investigator-fvtt-types";
import { useCallback } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { css } from "../../styled-system/css";

/** A label and its control side by side (shared with InitiativeAbilityPicker) */
export const inlineField = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5em",
});

// the "&&" beats Foundry's own h3 margins
export const inlineLabel = css({
  "&&": { margin: 0 },
  whiteSpace: "nowrap",
});

interface StatFieldProps {
  stat: Stat;
  id: string;
  /** The label beside the input, rather than above it */
  inline?: boolean;
}

export const StatField = ({ stat, id, inline = false }: StatFieldProps) => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const value = useActorSnapshot(
    actor,
    (snapshot): number | undefined => snapshot.system.stats[id],
  );
  const onChange = useCallback(
    (newVal: number) => {
      void actor.update({
        system: { stats: { ...actor.system.stats, [id]: newVal } },
      });
    },
    [actor, id],
  );

  return (
    <div className={inline ? inlineField : undefined}>
      <h3 className={inline ? inlineLabel : css({ gridColumn: "start / end" })}>
        {stat.name}
      </h3>
      <AsyncNumberInput
        className={inline ? css({ width: "7em" }) : undefined}
        min={stat.min ?? 0}
        max={stat.max}
        value={value ?? stat.default}
        onChange={onChange}
      />
    </div>
  );
};
