import { ButtonLink, useNavigationContext } from "@lumphammer/minirouter";
import { FaArrowLeft } from "react-icons/fa6";

import { cx } from "../../styled-system/css";
import { button } from "../../styled-system/recipes";
import { Translate } from "../Translate";

/**
 * A button to go up one step from the current settings panel, or nothing at
 * the top. Must be rendered at the root of the settings router.
 */
export const SettingsBackButton = ({ className }: { className?: string }) => {
  const { currentStep, childSteps } = useNavigationContext();
  const path = currentStep ? [currentStep, ...childSteps] : [];
  if (path.length === 0) {
    return null;
  }
  return (
    <ButtonLink
      from="root"
      to={path.slice(0, -1)}
      data-interactive
      className={cx(button({ kind: "ghost" }), className)}
      css={{ width: "auto", whiteSpace: "nowrap" }}
    >
      <FaArrowLeft css={{ fontSize: "0.8em", marginRight: "0.3em" }} />
      <Translate>Back</Translate>
    </ButtonLink>
  );
};

SettingsBackButton.displayName = "SettingsBackButton";
