import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { WeaponItem } from "../../module/items/weapon";
import { absoluteCover } from "../absoluteCover";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { WeaponAttackPanel } from "./WeaponAttackPanel";

interface WeaponMainProps {
  /** Only to write through (and for the attack panel, which reads it itself) */
  item: WeaponItem;
  notes: string;
}

export const WeaponMain = memo(function WeaponMain({
  item,
  notes,
}: WeaponMainProps) {
  const { setNotes } = useSystemMethods(item);
  return (
    <div css={{ ...absoluteCover, display: "flex", flexDirection: "column" }}>
      <WeaponAttackPanel weapon={item} />
      <div css={{ flex: 1, position: "relative", marginTop: "0.3em" }}>
        <RichTextEditor name="notes" html={notes} onSave={setNotes} />
      </div>
    </div>
  );
});
