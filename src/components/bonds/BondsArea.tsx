import { Router } from "@lumphammer/minirouter";
import { memo } from "react";

import { liveItems } from "../../functions/liveItems";
import { isBondItem } from "../../module/items/bond";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { getBondsIn } from "../../module/actors/pcDerived";
import { assertPCActor } from "../../module/actors/pc";
import {
  areBondsOn,
  getAdaptableTraumaTypesFrom,
} from "../../module/stability/settings";
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
import { tableHeader } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

/**
 * The Bonds tab on the PC sheet (Fall of DELTA GREEN, p. 045), with
 * adaptations to trauma. Either can be on without the other.
 */
export const BondsArea = memo(function BondsArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  // the Bonds' ids, in order (as `getBonds` sorts them): each row reads its
  // own Bond
  const ids = useActorSnapshot(actor, (snapshot) =>
    getBondsIn(snapshot.items).map((item) => item._id ?? ""),
  );
  const bonds = liveItems(actor, ids, isBondItem);
  const { showBonds, showAdaptations } = useSettings((s) => ({
    showBonds: areBondsOn(s),
    showAdaptations: getAdaptableTraumaTypesFrom(s).length > 0,
  }));
  const { createBond } = useSystemMethods(actor);
  const addBondTooltip = getTranslated("AddBondTooltip");

  return (
    <Router>
      <div
        data-testid="bonds-area"
        className={css({
          ...absoluteCover,
          overflow: "auto",
          padding: "0.5em",
        })}
      >
        {showBonds && (
          <>
            <div
              className={css({
                display: "flex",
                flexDirection: "row",
                // three buttons: in a narrow sheet they go under the heading
                flexWrap: "wrap",
                justifyContent: "end",
                gap: "0.5em",
              })}
            >
              <h2 className={css({ flex: "[1]", "&&": { margin: 0 } })}>
                <Translate>Bonds</Translate>
              </h2>
              <Button
                className={css({
                  flexBasis: "max-content",
                  alignSelf: "flex-start",
                })}
                onClick={createBond}
                title={addBondTooltip}
              >
                <i className="fa fa-plus" />
                <Translate>Add Bond</Translate>
              </Button>
              <EstablishBondButton />
              <TeamCrisisButton />
            </div>

            {bonds.length === 0 ? (
              <i className={css({ display: "block", fontSize: "1.2em" })}>
                <Translate>No Bonds yet!</Translate>
              </i>
            ) : (
              // a container, so the table can respond to its own width, and rows
              // can size the name against it (cqw)
              <div
                className={css({
                  containerType: "inline-size",
                  marginTop: "0.5em",
                })}
              >
                <div
                  className={css({
                    display: "grid",
                    // name (at least a third; a long one can take up to half: see
                    // `BondRow`, which caps it), badges, rating, and an empty
                    // column to take the slack, so the rating stays near the rest
                    // rather than out on the right; then the delete button
                    gridTemplateColumns:
                      "minmax(33.33%, max-content) max-content max-content 1fr max-content",
                    // when it's too narrow for a third plus both badges, the name
                    // gives way first (cut off), rather than the table overflowing
                    "@container (max-width: 28em)": {
                      gridTemplateColumns:
                        "minmax(0, max-content) max-content max-content 1fr max-content",
                    },
                    gridAutoRows: "min-content",
                    columnGap: "0.5em",
                  })}
                >
                  {/* the header row, underlined like the ability categories */}
                  <div
                    className={cx(
                      tableHeader(),
                      css({
                        gridColumn: "1/-1",
                        display: "grid",
                        gridTemplateColumns: "subgrid",
                        "& > *": { paddingInline: "0.25em" },
                      }),
                    )}
                  >
                    <div>
                      <Translate>Person Name</Translate>
                    </div>
                    <div />
                    <div className={css({ textAlign: "end" })}>
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
        {showAdaptations && <AdaptationTracker actor={actor} />}
      </div>
      <SlideInNestedPanelRoute direction={establish}>
        <EstablishBondPanel actor={actor} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={crisis}>
        <NestedTeamCrisisPanel actor={actor} />
      </SlideInNestedPanelRoute>
    </Router>
  );
});

BondsArea.displayName = "BondsArea";
