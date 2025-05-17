import { Fragment } from "react";
import {
  FaEdit,
  FaEllipsisV,
  FaEraser,
  FaRecycle,
  FaTrash,
} from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { Dropdown } from "../inputs/Dropdown";
import { Menu, MenuItem } from "../inputs/Menu";
import { useInititative } from "./useInititative";

interface StandardInitiativeProps {
  turn: any;
  combat: InvestigatorCombat;
}

export const StandardInitiative = ({
  turn,
  combat,
}: StandardInitiativeProps) => {
  assertGame(game);
  const {
    onDoInitiative,
    onConfigureCombatant,
    onClearInitiative,
    onRemoveCombatant,
    localize,
    openSheet,
  } = useInititative(combat, turn.id);

  return (
    <Fragment>
      <div
        className="token-initiative"
        css={
          {
            // flex: 0,
            // width: "auto",
          }
        }
      >
        {turn.hasRolled ? (
          // <span
          //   css={{
          //     fontSize: "1.6em",
          //   }}
          // >
          //   {turn.initiative}
          // </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="^[+=\-]?\d*"
            defaultValue={turn.initiative}
            aria-label="Initiative Score"
            disabled={!game.user.isGM}
          ></input>
        ) : (
          <button
            css={{
              display: "block",
              height: "var(--sidebar-item-height)",
              fontSize: "calc(var(--sidebar-item-height) - 20px)",
              // margin: "0 0.5em",
            }}
            title={localize("COMBAT.InitiativeRoll")}
            onClick={onDoInitiative}
          >
            <i className="fas fa-dice-d6" />
          </button>
        )}
      </div>

      {game.user.isGM && (
        <Dropdown
          showArrow={false}
          label={<FaEllipsisV />}
          className="inline-control"
          css={{
            flex: 0,
            minHeight: "var(--button-size)",
          }}
        >
          {
            <Menu>
              <MenuItem icon={<FaEdit />} onClick={onConfigureCombatant}>
                {localize("COMBAT.CombatantUpdate")}
              </MenuItem>
              <MenuItem icon={<FaEraser />} onClick={onClearInitiative}>
                {localize("COMBAT.CombatantClear")}
              </MenuItem>
              <MenuItem icon={<FaRecycle />} onClick={onDoInitiative}>
                {localize("investigator.RefreshInitiative")}
              </MenuItem>
              <MenuItem icon={<HiDocumentText />} onClick={openSheet}>
                {localize("investigator.OpenCharacterSheet")}
              </MenuItem>
              <MenuItem icon={<FaTrash />} onClick={onRemoveCombatant}>
                {localize("COMBAT.CombatantRemove")}
              </MenuItem>
            </Menu>
          }
        </Dropdown>
      )}
    </Fragment>
  );
};
