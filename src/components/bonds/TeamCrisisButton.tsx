import { useNavigationContext } from "@lumphammer/minirouter";

import { getTranslated } from "../../functions/getTranslated";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { crisis } from "./directions";

/**
 * Opens the panel for the Stability test after a team crisis (p. 046). It
 * needs the router's context, so it can't live in the component that
 * provides it.
 */
export const TeamCrisisButton = () => {
  const { navigate } = useNavigationContext();
  const tooltip = getTranslated("TeamCrisisTooltip");
  return (
    <Button
      data-testid="open-team-crisis"
      css={{ flexBasis: "max-content", alignSelf: "flex-start" }}
      onClick={() => navigate("here", crisis())}
      title={tooltip}
    >
      {/* Translate titles its span, which would hide the button's title */}
      <Translate title={tooltip}>Team Crisis</Translate>{" "}
      <i className="fa fa-arrow-right" />
    </Button>
  );
};

TeamCrisisButton.displayName = "TeamCrisisButton";
