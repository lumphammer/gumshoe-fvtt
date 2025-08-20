import { PiEmptyLight, PiPeaceLight } from "react-icons/pi";

import { assertGame } from "../../functions/isGame";
import { assertNotNull } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { DraggableRowContainer } from "./DraggableRowContainer";
import { EncounterNav } from "./EncounterNav";
import { localize } from "./functions";
import { TurnNav } from "./TurnNav";

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
  const isTurnPassing = isTurnPassingCombat(combat);

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  // const turns = combat ? getTurns(combat) : [];
  return (
    <>
      {/* HEADER ROWS */}
      <header id="combat-round" className="combat-tracker-header">
        {combat && (
          /* TOP ROW: ➕ 1️⃣ 2️⃣ 3️⃣ ⚙️ */
          <EncounterNav
            combatId={combatId}
            combatIndex={combatIndex}
            combatCount={combatCount}
            prevCombatId={prevCombatId}
            nextCombatId={nextCombatId}
          />
        )}

        <TurnNav isTurnPassing={isTurnPassing} combat={combat} game={game} />
      </header>
      {/* ACTUAL COMBATANTS, or "turns" in early-medieval foundry-speak */}
      {!combat && (
        <div
          css={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            textAlign: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          <PiPeaceLight size={100} />
          <p css={{ fontSize: "1.4em", fontWeight: "300" }}>
            {localize("investigator.NoCombat")}
          </p>
          {game.user.isGM && (
            <button
              type="button"
              // className="combat-control-lg"
              css={{
                justifySelf: "stretch",
                width: "auto",
              }}
              data-action="createCombat"
            >
              <i className="fa-solid fa-plus" inert />
              <span>{localize("COMBAT.Create")}</span>
            </button>
          )}
        </div>
      )}
      {combat && combat.turns.length === 0 && (
        <div
          css={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            textAlign: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          <PiEmptyLight size={100} />
          <p css={{ fontSize: "1.4em", fontWeight: "300" }}>
            {localize("investigator.NoParticipants")}
          </p>
        </div>
      )}
      {/* we need to wrap the actual tracker ol in another element so that
      foundry's autosizing works */}
      {combat && (
        <div
          className="combat-tracker"
          css={{
            flex: 1,
          }}
        >
          <DraggableRowContainer />
        </div>
      )}
    </>
  );
};
