import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { BondRow } from "./BondRow";

/**
 * The Bonds tab on the PC sheet (Fall of DELTA GREEN, p. 045).
 */
export const BondsArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const bonds = actor.system.getBonds();

  return (
    <div data-testid="bonds-area">
      <div css={{ display: "flex", flexDirection: "row" }}>
        <h2 css={{ flex: 1, "&&": { margin: 0 } }}>
          <Translate>Bonds</Translate>
        </h2>
        <Button
          css={{ flexBasis: "max-content", alignSelf: "flex-start" }}
          onClick={actor.system.createBond}
        >
          <i className="fa fa-plus" />
          <Translate>Add Bond</Translate>
        </Button>
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
  );
};

BondsArea.displayName = "BondsArea";
