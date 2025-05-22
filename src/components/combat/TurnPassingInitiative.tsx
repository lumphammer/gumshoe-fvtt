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

const playButtonGradientWidth = "3em";
const playButtonColor1 = "oklch(0.2 0.3 130)";
const playButtonColor2 = "oklch(0.8 0.3 130)";

const scrollBg = keyframes({
  "0%": {
    backgroundPositionX: "0em",
  },
  "100%": {
    backgroundPositionX: playButtonGradientWidth,
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
        <button
          className="inline-control"
          css={{
            display: "block",
            height: "var(--sidebar-item-height)",
            fontSize: "1.4em",
            margin: 0,
            padding: "0 0.2em",
            color: "var(--color-text-secondary)",
          }}
          title={getTranslated("Turn")}
          disabled={combat.round === 0}
          onClick={onTakeTurn}
        >
          {isActive && (
            <i
              className="fas fa-play"
              css={{
                color: "transparent",
                backgroundImage: `repeating-linear-gradient(to right, ${playButtonColor1}, ${playButtonColor2} 50%, ${playButtonColor1} 100%)`,
                backgroundSize: playButtonGradientWidth,
                backgroundPositionX: 0,
                backgroundPositionY: 0,
                backgroundClip: "text",
                animation: `${scrollBg} 2000ms infinite`,
                animationTimingFunction: "linear",
              }}
            />
          )}
          {!isActive && !depleted && <i className="fas fa-pause" />}
          {!isActive && depleted && <i className="fas fa-check" />}
        </button>
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
