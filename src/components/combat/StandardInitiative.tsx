import { Fragment, useEffect, useRef } from "react";
import { FaEdit, FaEraser, FaRecycle, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { assertGame } from "../../functions/isGame";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { NativeDualFunctionMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { NativeMenuLabel } from "../inputs/NativeMenu/NativeMenuLabel";
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = turn.initiative;
    }
  }, [turn.initiative]);

  return (
    <Fragment>
      <div className="token-initiative">
        {turn.hasRolled ? (
          <input
            ref={inputRef}
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
            }}
            title={localize("COMBAT.InitiativeRoll")}
            onClick={onDoInitiative}
          >
            <i className="fas fa-dice-d6" />
          </button>
        )}
      </div>
      {game.user.isGM && (
        <>
          <NativeDualFunctionMenu css={{ flex: 0, padding: "0 0.3em" }}>
            <NativeMenuLabel>{turn.name}</NativeMenuLabel>
            <NativeMenuItem icon={<FaEdit />} onSelect={onConfigureCombatant}>
              {localize("COMBAT.CombatantUpdate")}
            </NativeMenuItem>
            <NativeMenuItem icon={<FaEraser />} onSelect={onClearInitiative}>
              {localize("COMBAT.CombatantClear")}
            </NativeMenuItem>
            <NativeMenuItem icon={<FaRecycle />} onSelect={onDoInitiative}>
              {localize("investigator.RefreshInitiative")}
            </NativeMenuItem>
            <NativeMenuItem icon={<HiDocumentText />} onSelect={openSheet}>
              {localize("investigator.OpenCharacterSheet")}
            </NativeMenuItem>
            <NativeMenuItem icon={<FaTrash />} onSelect={onRemoveCombatant}>
              {localize("COMBAT.CombatantRemove")}
            </NativeMenuItem>
          </NativeDualFunctionMenu>
        </>
      )}
    </Fragment>
  );
};
