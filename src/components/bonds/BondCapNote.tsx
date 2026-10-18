import type { PCActor } from "../../module/actors/pc";
import { Translate } from "../Translate";

/**
 * A reminder, when an Agent is Adapted to Violence, that their Bonds won't
 * go above the cap.
 */
export const BondCapNote = ({ actor }: { actor: PCActor }) => {
  if (!actor.system.isAdaptedTo("violence")) {
    return null;
  }
  return (
    <p data-testid="bond-cap-note">
      <Translate values={{ BondCap: String(actor.system.getBondCap()) }}>
        BondCapNote
      </Translate>
    </p>
  );
};

BondCapNote.displayName = "BondCapNote";
