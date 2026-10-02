import { useCallback } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import type { Lethality } from "../../module/attacks/lethality";
import {
  formatLethality,
  parseLethality,
} from "../../module/attacks/lethality";
import { GridField } from "../inputs/GridField";
import { TextInput } from "../inputs/TextInput";

type WeaponLethalityFieldProps = {
  lethality: Lethality | null;
  setLethality: (lethality: Lethality | null) => Promise<void>;
};

/**
 * Lethality, typed in the book's notation, e.g. "L1*". Blank means none. Only
 * valid ratings get saved; anything else shows as invalid until fixed.
 */
export const WeaponLethalityField = ({
  lethality,
  setLethality,
}: WeaponLethalityFieldProps) => {
  // stable, so useAsyncUpdate's throttle survives re-renders
  const onChangeText = useCallback(
    (newText: string) => {
      if (newText.trim() === "") {
        void setLethality(null);
        return;
      }
      const newLethality = parseLethality(newText);
      if (newLethality) {
        void setLethality(newLethality);
      }
    },
    [setLethality],
  );

  // throttles saves, and ignores updates coming back while focused, so
  // echoes of earlier saves can't overwrite what's being typed
  const { display, onChange, onFocus, onBlur } = useAsyncUpdate(
    lethality ? formatLethality(lethality) : "",
    onChangeText,
  );

  const isValid = display.trim() === "" || parseLethality(display) !== null;

  return (
    <GridField label="Lethality">
      <TextInput
        value={display}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={getTranslated("LethalityPlaceholder")}
        validation={
          isValid
            ? undefined
            : {
                state: "failed",
                reasons: [getTranslated("LethalityFormatHint")],
              }
        }
      />
    </GridField>
  );
};
