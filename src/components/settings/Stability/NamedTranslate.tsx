import { useContext } from "react";

import { getTranslated } from "../../../functions/getTranslated";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";

/**
 * The configured names of Stability and Sanity, from the unsaved settings,
 * or the translated defaults if they're empty
 */
export const useStabilityNames = (): { Stability: string; Sanity: string } => {
  const { settings } = useContext(StateContext);
  return {
    Stability: settings.stabilityAbility || getTranslated("Stability"),
    Sanity: settings.sanityAbility || getTranslated("Sanity"),
  };
};

/**
 * Translated text with {Stability} and {Sanity} filled in with the
 * configured names
 */
export const NamedTranslate = ({ children }: { children: string }) => {
  const names = useStabilityNames();
  return <Translate values={names}>{children}</Translate>;
};

NamedTranslate.displayName = "NamedTranslate";
