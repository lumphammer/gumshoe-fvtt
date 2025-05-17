import { keyframes } from "@emotion/react";
import { Fragment } from "react";
import { FaEdit, FaEllipsisV, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { Dropdown } from "../inputs/Dropdown";
import { Menu, MenuItem } from "../inputs/Menu";
import { useInititative } from "./useInititative";

interface StandardInitiativeProps {
  turn: any;
  combat: InvestigatorCombat;
}

const scrollBg = keyframes({
  "0%": {
    backgroundPositionX: "0em",
  },
  "100%": {
    backgroundPositionX: "0.5em",
  },
});

export const TurnPassingInitiative = ({
  turn,
  combat,
}: StandardInitiativeProps) => {
  assertGame(game);
  const {
    onTakeTurn,
    onConfigureCombatant,
    onRemoveCombatant,
    localize,
    onAddTurn,
    onRemoveTurn,
    openSheet,
  } = useInititative(combat, turn.id);

  const isActive = combat.activeTurnPassingCombatant === turn.id;
  const depleted = turn.passingTurnsRemaining <= 0;

  return (
    <Fragment>
      <div css={{ flex: 0 }}>
        {turn.passingTurnsRemaining}/{turn.totalPassingTurns}
      </div>

      <div css={{ flex: 0 }}>
        <a
          css={{
            display: "block",
            height: "var(--sidebar-item-height)",
            fontSize: "calc(var(--sidebar-item-height) - 20px)",
            margin: "0 0.5em",
          }}
          title={getTranslated("Turn")}
          onClick={onTakeTurn}
        >
          {isActive && (
            <i
              className="fas fa-play"
              css={{
                color: "transparent",
                backgroundImage:
                  "repeating-linear-gradient(90deg, #3f3, #161 50%, #0f0 100%)",
                backgroundSize: "0.5em",
                backgroundPositionX: 0,
                backgroundPositionY: 0,
                backgroundClip: "text",
                animation: `${scrollBg} 2400ms infinite`,
                animationTimingFunction: "linear",
                textShadow: "0 0 0.5em #0f0",
                "-webkit-text-stroke": "1px #9f7",
              }}
            />
          )}
          {!isActive && !depleted && (
            <i
              className="fas fa-pause"
              css={{
                color: "#f90",
                "-webkit-text-stroke": "1px #ff9",
              }}
            />
          )}
          {!isActive && depleted && (
            <i
              className="fas fa-check"
              css={{
                color: "#ccf",
                "-webkit-text-stroke": "1px #fff",
              }}
            />
          )}
        </a>
      </div>

      {game.user.isGM && (
        <Dropdown
          showArrow={false}
          label={<FaEllipsisV />}
          css={{
            flex: 0,
          }}
        >
          {
            <Menu>
              <MenuItem icon={<FaEdit />} onClick={onConfigureCombatant}>
                {localize("COMBAT.CombatantUpdate")}
              </MenuItem>
              <MenuItem icon={<FaPlus />} onClick={onAddTurn}>
                {localize("investigator.AddTurn")}
              </MenuItem>
              <MenuItem icon={<FaMinus />} onClick={onRemoveTurn}>
                {localize("investigator.RemoveTurn")}
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
