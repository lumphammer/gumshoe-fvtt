import { keyframes } from "@emotion/react";
import { Fragment } from "react";
import { FaEdit, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { TurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { NativeMenuItem } from "../inputs/NativeMenu";
import { NativeDualFunctionMenu } from "../inputs/NativeMenu/NativeDualFunctionMenu";
import { NativeMenuLabel } from "../inputs/NativeMenu/NativeMenuLabel";
import { useInititative } from "./useInititative";

interface TurnPassingInitiativeProps {
  combatant: TurnPassingCombatant;
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
  combatant,
  combat,
}: TurnPassingInitiativeProps) => {
  assertGame(game);
  const {
    onTakeTurn,
    onConfigureCombatant,
    onRemoveCombatant,
    localize,
    onAddTurn,
    onRemoveTurn,
    openSheet,
  } = useInititative(combatant);

  const activeTurnPassingCombatant =
    combat.turn !== null ? combat.turns[combat.turn].id : null;
  const isActive = activeTurnPassingCombatant === combatant.id;
  const depleted = combatant.system.passingTurnsRemaining <= 0;

  return (
    <Fragment>
      <div css={{ flex: 0 }}>
        {combatant.system.passingTurnsRemaining}/
        {combatant.system.defaultPassingTurns}
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
            ":hover": {
              color: "var(--button-hover-text-color)",
            },
          }}
          title={getTranslated("Turn")}
          // disabled={combat.round === 0}
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
        <NativeDualFunctionMenu css={{ flex: 0, padding: "0 0.3em" }}>
          <NativeMenuLabel>{combatant.name}</NativeMenuLabel>
          <NativeMenuItem icon={<FaEdit />} onSelect={onConfigureCombatant}>
            {localize("COMBAT.CombatantUpdate")}
          </NativeMenuItem>
          <NativeMenuItem icon={<FaPlus />} onSelect={onAddTurn}>
            {localize("investigator.AddTurn")}
          </NativeMenuItem>
          <NativeMenuItem icon={<FaMinus />} onSelect={onRemoveTurn}>
            {localize("investigator.RemoveTurn")}
          </NativeMenuItem>
          <NativeMenuItem icon={<HiDocumentText />} onSelect={openSheet}>
            {localize("investigator.OpenCharacterSheet")}
          </NativeMenuItem>
          <NativeMenuItem icon={<FaTrash />} onSelect={onRemoveCombatant}>
            {localize("COMBAT.CombatantRemove")}
          </NativeMenuItem>
        </NativeDualFunctionMenu>
      )}
    </Fragment>
  );
};
