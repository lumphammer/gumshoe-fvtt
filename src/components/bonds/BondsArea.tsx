import { Router } from "@lumphammer/minirouter";

import { getTranslated } from "../../functions/getTranslated";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { Translate } from "../Translate";
import { BondRow } from "./BondRow";
import { establish } from "./directions";
import { EstablishBondPanel } from "./EstablishBondPanel";
import { EstablishBondButton } from "./EstablishBondButton";

/**
 * The Bonds tab on the PC sheet (Fall of DELTA GREEN, p. 045).
 */
export const BondsArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const bonds = actor.system.getBonds();
  const addBondTooltip = getTranslated("AddBondTooltip");

  return (
    <Router>
      <div
        data-testid="bonds-area"
        css={{ ...absoluteCover, overflow: "auto", padding: "0.5em" }}
      >
        <div css={{ display: "flex", flexDirection: "row", gap: "0.5em" }}>
          <h2 css={{ flex: 1, "&&": { margin: 0 } }}>
            <Translate>Bonds</Translate>
          </h2>
          <Button
            css={{ flexBasis: "max-content", alignSelf: "flex-start" }}
            onClick={actor.system.createBond}
            title={addBondTooltip}
          >
            <i className="fa fa-plus" />
            {/* Translate titles its span, which would hide the button's title */}
            <Translate title={addBondTooltip}>Add Bond</Translate>
          </Button>
          <EstablishBondButton />
        </div>

        {bonds.length === 0 ? (
          <i css={{ display: "block", fontSize: "1.2em" }}>
            <Translate>No Bonds yet!</Translate>
          </i>
        ) : (
          <div
            css={{
              display: "grid",
              gridTemplateColumns: "1fr max-content max-content",
              gridAutoRows: "min-content",
              alignItems: "center",
              columnGap: "0.5em",
              rowGap: "0.25em",
            }}
          >
            {bonds.map((bond) => (
              <BondRow key={bond.id} bond={bond} />
            ))}
          </div>
        )}
      </div>
      <SlideInNestedPanelRoute direction={establish}>
        <EstablishBondPanel actor={actor} />
      </SlideInNestedPanelRoute>
    </Router>
  );
};

BondsArea.displayName = "BondsArea";
