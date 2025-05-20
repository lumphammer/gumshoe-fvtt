import { Fragment, ReactNode } from "react";

import {
  assertGame,
  assertNotNull,
  sortByKey,
} from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { settings } from "../../settings/settings";
import { CombatantRow } from "./CombatantRow";
import { EncounterNavigation } from "./EncounterNavigation";
import { localize } from "./functions";
import { getTurns } from "./getTurns";
import { TurnBar } from "./TurnBar";

const settingsUseTurnPassing = settings.useTurnPassingInitiative.get;

export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA
  const combat = game.combats?.active as InvestigatorCombat | undefined;
  const combatId = combat?._id;
  const combatCount = game.combats?.combats.length ?? 0;
  const combatIndex = game.combats?.combats.findIndex(
    (x) => x._id === combatId,
  );
  const prevCombatId = game.combats?.combats[combatIndex - 1]?._id;
  const nextCombatId = game.combats?.combats[combatIndex + 1]?._id;
  const hasCombat = !!combat;
  const isTurnPassing = settingsUseTurnPassing();

  if (combat === null) {
    return null;
  }

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  const turns = combat ? getTurns(combat) : [];

  return (
    <Fragment>
      {/* HEADER ROWS */}
      <header id="combat-round" className="combat-tracker-header">
        {game.user.isGM &&
          (hasCombat ? (
            /* TOP ROW: ➕ 1️⃣ 2️⃣ 3️⃣ ⚙️ */
            <EncounterNavigation
              combatId={combatId}
              combatIndex={combatIndex}
              combatCount={combatCount}
              prevCombatId={prevCombatId}
              nextCombatId={nextCombatId}
            />
          ) : (
            // end top row
            <button
              type="button"
              className="combat-control-lg"
              data-action="createCombat"
            >
              <i className="fa-solid fa-plus" inert></i>
              <span>{localize("COMBAT.Create")}</span>
            </button>
          ))}

        {/* SECOND ROW: Roll all / NPCs, Round 1, dropdown */}
        {/* <TurnHeader
          hasCombat={hasCombat}
          combatCount={combatCount}
          combat={combat!}
          game={game}
        /> */}
        {!isTurnPassing && (
          <TurnBar
            isTurnPassing={isTurnPassing}
            hasCombat={hasCombat}
            combat={combat!}
            game={game}
          />
        )}
      </header>
      {/* ACTUAL COMBATANTS, or "turns" in early-medieval foundry-speak */}
      <ol
        // see investigator-combatant-list in the LESS for why we add this class
        className="combat-tracker plain investigator-combatant-list"
        css={{
          position: "relative",
        }}
      >
        {
          // combatant sorting is done in "Combat" but for rendering stability
          // we need to un-sort the combatants and then tell each row where it
          // used to exist in the order
          sortByKey(turns, "id").map<ReactNode>((turn) => (
            <CombatantRow
              key={turn.id}
              index={turns.findIndex((x) => x.id === turn.id)}
              turn={turn}
              combat={combat!}
            />
          ))
        }
      </ol>
    </Fragment>
  );
};
