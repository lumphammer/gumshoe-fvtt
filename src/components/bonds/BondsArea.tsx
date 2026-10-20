import { Router } from "@lumphammer/minirouter";
import { useContext } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import {
  areBondsOn,
  getAdaptableTraumaTypes,
} from "../../module/stability/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { Translate } from "../Translate";
import { AdaptationTracker } from "./AdaptationTracker";
import { BondRow } from "./BondRow";
import { crisis, establish } from "./directions";
import { EstablishBondPanel } from "./EstablishBondPanel";
import { EstablishBondButton } from "./EstablishBondButton";
import { TeamCrisisButton } from "./TeamCrisisButton";
import { NestedTeamCrisisPanel } from "./NestedTeamCrisisPanel";

/**
 * The Bonds tab on the PC sheet (Fall of DELTA GREEN, p. 045), with
 * adaptations to trauma. Either can be on without the other.
 */
export const BondsArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const bonds = actor.system.getBonds();
  const theme = useContext(ThemeContext);
  const addBondTooltip = getTranslated("AddBondTooltip");
  const showBonds = areBondsOn();

  return (
    <Router>
      <div
        data-testid="bonds-area"
        css={{ ...absoluteCover, overflow: "auto", padding: "0.5em" }}
      >
        {showBonds && (
          <>
            <div
              css={{
                display: "flex",
                flexDirection: "row",
                // three buttons: in a narrow sheet they go under the heading
                flexWrap: "wrap",
                justifyContent: "end",
                gap: "0.5em",
              }}
            >
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
              <TeamCrisisButton />
            </div>

            {bonds.length === 0 ? (
              <i css={{ display: "block", fontSize: "1.2em" }}>
                <Translate>No Bonds yet!</Translate>
              </i>
            ) : (
              // a container, so the table can respond to its own width, and rows
              // can size the name against it (cqw)
              <div css={{ containerType: "inline-size", marginTop: "0.5em" }}>
                <div
                  css={{
                    display: "grid",
                    // name (at least a third; a long one can take up to half: see
                    // `BondRow`, which caps it), badges, rating, and an empty
                    // column to take the slack, so the rating stays near the rest
                    // rather than out on the right
                    gridTemplateColumns:
                      "minmax(33.33%, max-content) max-content max-content 1fr",
                    // when it's too narrow for a third plus both badges, the name
                    // gives way first (cut off), rather than the table overflowing
                    "@container (max-width: 28em)": {
                      gridTemplateColumns:
                        "minmax(0, max-content) max-content max-content 1fr",
                    },
                    gridAutoRows: "min-content",
                    columnGap: "0.5em",
                  }}
                >
                  {/* the header row, underlined like the ability categories */}
                  <div
                    css={{
                      gridColumn: "1/-1",
                      display: "grid",
                      gridTemplateColumns: "subgrid",
                      fontWeight: "bold",
                      borderBottom: `1px solid ${theme.colors.text}`,
                      "& > *": { paddingInline: "0.25em" },
                    }}
                  >
                    <div>
                      <Translate>Person Name</Translate>
                    </div>
                    <div />
                    <div css={{ textAlign: "end" }}>
                      <Translate>Rating</Translate>
                    </div>
                  </div>
                  {bonds.map((bond) => (
                    <BondRow key={bond.id} bond={bond} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {getAdaptableTraumaTypes().length > 0 && (
          <AdaptationTracker actor={actor} />
        )}
      </div>
      <SlideInNestedPanelRoute direction={establish}>
        <EstablishBondPanel actor={actor} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={crisis}>
        <NestedTeamCrisisPanel actor={actor} />
      </SlideInNestedPanelRoute>
    </Router>
  );
};

BondsArea.displayName = "BondsArea";
