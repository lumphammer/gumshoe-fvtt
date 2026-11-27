import { memo } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { openSheet } from "../../functions/openSheet";
import { useItemSnapshot } from "../../hooks/useItemSnapshot";
import type { AbilityItem } from "../../module/items/exports";
import { css, cx } from "../../styled-system/css";
import { displayText } from "../../styled-system/recipes";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { AbilityRollControls } from "../abilities/AbilityRollControls";
import { Button } from "../inputs/Button";
import { SpecialityTags } from "./AbilitySpecialities";

interface AbilityRollPanelProps {
  /** The live ability: read through a snapshot */
  ability: AbilityItem;
  /** Close the popover it's in */
  onClose: () => void;
}

/**
 * What an ability row's popover holds: the ability's name and pool, its
 * specialities and badges, and the same controls as its sheet, which close the popover
 * once something has been rolled or spent.
 */
export const AbilityRollPanel = memo(function AbilityRollPanel({
  ability: item,
  onClose,
}: AbilityRollPanelProps) {
  const ability = useItemSnapshot(item);
  const { name, system } = ability;

  return (
    <div className={css({ display: "flex", flexDirection: "column" })}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          marginBottom: "0.25em",
        })}
      >
        <span className={cx(displayText({ size: "md" }), css({ flex: "1" }))}>
          {name}
        </span>
        <span>
          {system.pool}/{system.rating}
        </span>
        <Button
          kind="ghost"
          className={css({ width: "auto" })}
          onClick={() => {
            onClose();
            openSheet(item);
          }}
          aria-label={getTranslated("OpenSheet")}
          title={getTranslated("OpenSheet")}
        >
          <i className="fa fa-up-right-from-square" aria-hidden="true" />
        </Button>
        <Button
          kind="ghost"
          className={css({ width: "auto" })}
          onClick={onClose}
          aria-label={getTranslated("Close")}
          title={getTranslated("Close")}
        >
          <i className="fa fa-xmark" aria-hidden="true" />
        </Button>
      </div>
      {system.hasSpecialities && system.specialities.some((x) => x.trim()) && (
        <SpecialityTags
          specialities={system.specialities}
          className={css({ marginBottom: "0.5em" })}
        />
      )}
      {/* hidden when there are none (componentDefaults.css) */}
      <AbilityBadges
        ability={item}
        className={css({ justifyContent: "start", marginBottom: "0.5em" })}
      />
      <AbilityRollControls item={item} ability={ability} onDone={onClose} />
    </div>
  );
});
