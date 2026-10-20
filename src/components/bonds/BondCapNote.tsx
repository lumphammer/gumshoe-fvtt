import type { PCActor } from "../../module/actors/pc";
import { Translate } from "../Translate";

/**
 * A reminder, when an Agent is adapted to something which caps Bonds (e.g.
 * Violence), that their Bonds won't go above the cap.
 */
export const BondCapNote = ({ actor }: { actor: PCActor }) => {
  const adaptedTo = actor.system.getAdaptedTraumaNames(
    (type) => type.capsBonds,
  );
  if (adaptedTo.length === 0) {
    return null;
  }
  return (
    <p data-testid="bond-cap-note">
      <Translate
        values={{
          BondCap: String(actor.system.getBondCap()),
          Trauma: new Intl.ListFormat(game.i18n?.lang).format(adaptedTo),
        }}
      >
        BondCapNote
      </Translate>
    </p>
  );
};

BondCapNote.displayName = "BondCapNote";
