import { keyframes } from "@emotion/react";
import { memo, useCallback } from "react";
import { FaEdit, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { getTranslated } from "../../../functions/getTranslated";
import { assertGame } from "../../../functions/isGame";
import { requestTurnPass } from "../../../functions/utilities";
import type { TurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { NativeMenuItem } from "../../inputs/NativeMenu";
import { NativeDualFunctionMenu } from "../../inputs/NativeMenu/NativeDualFunctionMenu";
import { NativeMenuLabel } from "../../inputs/NativeMenu/NativeMenuLabel";
import { useTurnPassingCombatantContext } from "./CombatantContext";
import { useCombatantTurn, usePassingTurns } from "./CombatantTurnContext";
import { useInititative } from "./useInititative";

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

/**
 * The GM's menu for a combatant (also its context menu). Memoised, and given
 * only what it shows: its items are new elements on every render, so
 * otherwise each change to the combatant, or a new round, re-renders every
 * row's menus.
 */
const TurnPassingMenu = memo(function TurnPassingMenu({
  combatant,
  name,
}: {
  combatant: TurnPassingCombatant;
  name: string;
}) {
  "use memo";

  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);
  const { onConfigureCombatant, onRemoveCombatant, openSheet } =
    useInititative(combatant);

  const onAddTurn = useCallback(() => {
    void combatant.system.addPassingTurn();
  }, [combatant]);

  const onRemoveTurn = useCallback(() => {
    void combatant.system.removePassingTurn();
  }, [combatant]);

  return (
    <NativeDualFunctionMenu css={{ flex: 0, padding: "0 0.3em" }}>
      <NativeMenuLabel>{name}</NativeMenuLabel>
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
  );
});

export const TurnPassingInitiative = memo(function TurnPassingInitiative() {
  "use memo";

  assertGame(game);
  const { combatant, combatantState } = useTurnPassingCombatantContext();
  // not the tracker's context, which changes on every combat update
  const { active: isActive } = useCombatantTurn();
  // (follows the round, which they depend on)
  const passingTurns = usePassingTurns(combatant);
  const combat = combatant.combat;
  if (combat === null || combatantState === null) {
    throw new Error(
      "TurnPassingInitiative must be rendered with a combatant that is in combat.",
    );
  }

  const onTakeTurn = useCallback(() => {
    assertGame(game);

    // call `requestTurnPass` on everyone's client - the GM's client will pick
    // this up and perform the turn pass
    requestTurnPass(combatant.id);
  }, [combatant.id]);

  const depleted = (passingTurns?.remaining ?? 0) <= 0;

  return (
    <>
      <div css={{ flex: 0, padding: "0.3em 01em 0 0" }}>
        {passingTurns?.remaining}/{passingTurns?.total}
      </div>

      <div css={{ flex: 0 }}>
        <button
          className="inline-control"
          css={{
            display: "block",
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
        <TurnPassingMenu
          combatant={combatant}
          name={combatantState.name ?? ""}
        />
      )}
    </>
  );
});
