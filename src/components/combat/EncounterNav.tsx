import { FaPlus } from "react-icons/fa6";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { DialogV2 } from "../../fvtt-exports";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";

interface EncounterNavProps {
  combatId: string | undefined | null;
  combatIndex: number;
  combatCount: number;
  prevCombatId: string | undefined | null;
  nextCombatId: string | undefined | null;
}

export const EncounterNav = ({
  combatId,
  combatIndex,
  combatCount,
  prevCombatId,
  nextCombatId,
}: EncounterNavProps) => {
  assertGame(game);

  return (
    <nav className="encounters tabbed">
      {game.user?.isGM && (
        // <button
        //   className="inline-control icon fa-solid fa-plus"
        //   data-action="createCombat"
        //   data-tooltip
        //   aria-label="Create Encounter"
        //   title={localize("COMBAT.Create")}
        // ></button>
        <NativeDropdownMenu
          css={{ minHeight: "var(--button-size)" }}
          label={<FaPlus />}
        >
          <NativeMenuItem
            icon={<LuSwords />}
            onSelect={async () => {
              const combat = await Combat.implementation.create({
                type: "classic",
              });
              await combat?.activate({ render: false });
            }}
          >
            {localize("investigator.CreateClassicCombat")}
          </NativeMenuItem>
          <NativeMenuItem
            icon={<LuSwords />}
            onSelect={async () => {
              const combat = await Combat.implementation.create({
                type: "turnPassing",
              });
              await combat?.activate({ render: false });
            }}
          >
            {localize("investigator.CreateTurnPassingCombat")}
          </NativeMenuItem>
        </NativeDropdownMenu>
      )}
      <div className="cycle-combats">
        {game.user?.isGM && (
          <button
            type="button"
            className="inline-control icon fa-solid fa-caret-left"
            data-action="cycleCombat"
            data-combat-id={prevCombatId}
            data-tooltip=""
            aria-label="Activate Previous Encounter"
            disabled={!prevCombatId}
          ></button>
        )}
        <div
          className="encounter-count"
          css={{
            // https://github.com/foundryvtt/foundryvtt/issues/12872
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="value">
            {format("investigator.EncounterNofM", {
              N: (combatIndex + 1).toString(),
              M: combatCount.toString(),
            })}
          </span>
        </div>
        {game.user?.isGM && (
          <button
            type="button"
            className="inline-control icon fa-solid fa-caret-right"
            data-action="cycleCombat"
            data-combat-id={nextCombatId}
            disabled={!nextCombatId}
            data-tooltip=""
            aria-label="Activate Next Encounter"
          ></button>
        )}
      </div>{" "}
      {game.user?.isGM && (
        <button
          type="button"
          className={"inline-control icon fa-solid fa-xmark"}
          title={localize("COMBAT.End")}
          // data-action doesn't work here - I guess it's in the wrong bit of the
          // DOM tree
          // data-action="endCombat"
          onClick={(event) => {
            void DialogV2.confirm({
              window: { title: "COMBAT.EndTitle" },
              content: `<p>${game.i18n.localize("COMBAT.EndConfirmation")}</p>`,
              yes: {
                callback: () => {
                  void game?.combats.active?.delete();
                },
              },
              modal: true,
            });
          }}
        ></button>
      )}
    </nav>
  );
};
