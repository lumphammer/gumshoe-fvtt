import type { MouseEvent, ReactNode } from "react";
import { memo } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { openSheet } from "../../functions/openSheet";
import { useDragStart } from "../../hooks/useDragStart";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilityItem } from "../../module/items/exports";
import { cx } from "../../styled-system/css";
import { row } from "../../styled-system/recipes";
import { AbilityRollPanel } from "./AbilityRollPanel";
import { RollPopover } from "./RollPopover";

interface AbilityRollRowProps {
  /** The live ability: read through a snapshot */
  ability: AbilityItem;
  /** the row's cells (its name, its pool), in the area's columns */
  children: ReactNode;
  className?: string;
}

/**
 * An ability's row on a character sheet: a button which opens a popover to
 * test or spend it (or, for someone who can't, its sheet). Right-click opens
 * its sheet, and it can be dragged to another sheet.
 */
export const AbilityRollRow = memo(function AbilityRollRow({
  ability,
  children,
  className,
}: AbilityRollRowProps) {
  const name = useItemSelector(ability, (snapshot) => snapshot.name ?? "");
  const isEditable = useIsEditable();
  const onDragStart = useDragStart();

  const triggerProps = {
    className: cx(
      row({ interactive: true }),
      "inv-default-ability-roll-trigger",
      className,
    ),
    draggable: true,
    "data-item-id": ability.id,
    onDragStart,
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      openSheet(ability);
    },
  };

  if (!isEditable) {
    return (
      <button
        type="button"
        {...triggerProps}
        onClick={() => openSheet(ability)}
      >
        {children}
      </button>
    );
  }

  return (
    <RollPopover
      trigger={children}
      triggerProps={{
        ...triggerProps,
        title: getTranslated("AbilityRowHint"),
      }}
      label={name}
    >
      {(close) => <AbilityRollPanel ability={ability} onClose={close} />}
    </RollPopover>
  );
});
