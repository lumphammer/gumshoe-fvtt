import { Fragment, useEffect, useRef } from "react";
import { FaEdit, FaEraser, FaRecycle, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { assertGame } from "../../functions/isGame";
import { ClassicCombatant } from "../../module/combat/classicCombatant";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { NativeDualFunctionMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { NativeMenuLabel } from "../inputs/NativeMenu/NativeMenuLabel";
import { useInititative } from "./useInititative";

interface ClassicInitiativeProps {
  combatant: ClassicCombatant;
  combat: InvestigatorCombat;
}

export const ClassicInitiative = ({
  combatant,
  combat,
}: ClassicInitiativeProps) => {
  assertGame(game);
  const {
    onDoInitiative,
    onConfigureCombatant,
    onClearInitiative,
    onRemoveCombatant,
    localize,
    openSheet,
  } = useInititative(combatant);

  const inputRef = useRef<HTMLInputElement>(null);
  const initString = (combatant.initiative ?? 0).toString();

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = initString;
    }
  }, [initString, combatant.initiative]);

  const updateInitiative = () => {
    const value = inputRef.current?.value ?? "";
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      return;
    }
    void combat.updateEmbeddedDocuments("Combatant", [
      {
        _id: combatant.id,
        initiative: parsedValue,
      },
    ]);
  };

  return (
    <Fragment>
      <div className="token-initiative">
        {combatant.initiative !== null ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateInitiative();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="^[+=\-]?\d*"
              defaultValue={initString}
              aria-label="Initiative Score"
              disabled={!game.user.isGM}
              onBlur={updateInitiative}
            ></input>
          </form>
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
            <NativeMenuLabel>{combatant.name}</NativeMenuLabel>
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
