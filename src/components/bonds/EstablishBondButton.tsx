import { useNavigationContext } from "@lumphammer/minirouter";

import { getTranslated } from "../../functions/getTranslated";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { establish } from "./directions";

/**
 * Opens the panel to establish a new Bond in play (p. 129). It needs the
 * router's context, so it can't live in the component that provides it.
 */
export const EstablishBondButton = () => {
  const { navigate } = useNavigationContext();
  const tooltip = getTranslated("EstablishBondTooltip");
  return (
    <Button
      data-testid="open-establish-bond"
      css={{ flexBasis: "max-content", alignSelf: "flex-start" }}
      onClick={() => navigate("here", establish())}
      title={tooltip}
    >
      <Translate>Establish Bond</Translate> <i className="fa fa-arrow-right" />
    </Button>
  );
};

EstablishBondButton.displayName = "EstablishBondButton";
