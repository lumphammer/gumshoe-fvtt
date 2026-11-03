import { openSheet } from "../../functions/openSheet";
import { useDragStart } from "../../hooks/useDragStart";
import type { AbilityItem } from "../../module/items/exports";

type AbilityNameLinkProps = {
  /** the live ability, to open and drag */
  ability: AbilityItem;
  name: string;
  className?: string;
};

/**
 * An ability's name in its row on a character sheet: clicking it opens the
 * ability's sheet, and it can be dragged (e.g. to another sheet).
 */
export const AbilityNameLink = ({
  ability,
  name,
  className,
}: AbilityNameLinkProps) => {
  const onDragStart = useDragStart();
  return (
    <a
      onClick={() => openSheet(ability)}
      data-item-id={ability.id}
      onDragStart={onDragStart}
      draggable="true"
      className={className}
      css={{ gridColumn: "ability", textAlign: "end" }}
    >
      {name}
    </a>
  );
};
