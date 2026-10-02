import { useState } from "react";

import { getTranslated } from "../../functions/getTranslated";
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
  const formatted = lethality ? formatLethality(lethality) : "";
  const [text, setText] = useState(formatted);
  const [prevFormatted, setPrevFormatted] = useState(formatted);
  const isBlank = text.trim() === "";
  const parsed = isBlank ? null : parseLethality(text);
  const isValid = isBlank || parsed !== null;

  // if the rating changes underneath us (another user, a macro), show it,
  // unless what's typed already means the same thing
  if (formatted !== prevFormatted) {
    setPrevFormatted(formatted);
    const typed = isBlank ? "" : parsed ? formatLethality(parsed) : null;
    if (typed !== formatted) {
      setText(formatted);
    }
  }

  const onChange = (newText: string) => {
    setText(newText);
    if (newText.trim() === "") {
      void setLethality(null);
      return;
    }
    const newLethality = parseLethality(newText);
    if (newLethality) {
      void setLethality(newLethality);
    }
  };

  return (
    <GridField label="Lethality">
      <TextInput
        value={text}
        onChange={onChange}
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
