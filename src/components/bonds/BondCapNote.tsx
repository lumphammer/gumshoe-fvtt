import type { PCView } from "../../module/actors/pcDerived";
import {
  getAdaptedTraumaNamesIn,
  getBondCapIn,
} from "../../module/actors/pcDerived";
import type { SettingsView } from "../../settings/settingsView";
import { Translate } from "../Translate";

export type BondCap = {
  /** what the Agent has adapted to which caps Bonds */
  adaptedTo: string[];
  cap: number;
};

/** What `BondCapNote` shows, from a PC (a snapshot or the live actor) */
export const getBondCapOf = (pc: PCView, s?: SettingsView): BondCap => ({
  adaptedTo: getAdaptedTraumaNamesIn(pc, (type) => type.capsBonds, s),
  cap: getBondCapIn(pc, s),
});

/**
 * A reminder, when an Agent is adapted to something which caps Bonds (e.g.
 * Violence), that their Bonds won't go above the cap.
 */
export const BondCapNote = ({ adaptedTo, cap }: BondCap) => {
  "use memo";

  if (adaptedTo.length === 0) {
    return null;
  }
  return (
    <p data-testid="bond-cap-note">
      <Translate
        values={{
          BondCap: String(cap),
          Trauma: new Intl.ListFormat(game.i18n?.lang).format(adaptedTo),
        }}
      >
        BondCapNote
      </Translate>
    </p>
  );
};

BondCapNote.displayName = "BondCapNote";
