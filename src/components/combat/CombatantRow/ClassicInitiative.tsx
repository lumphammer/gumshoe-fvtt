import { memo, useCallback, useEffect, useRef } from "react";
import { FaEdit, FaRecycle, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { assertGame } from "../../../functions/isGame";
import { assertClassicCombatant } from "../../../module/combat/classicCombatant";
import {
  NativeDualFunctionMenu,
  NativeMenuItem,
} from "../../inputs/NativeMenu";
import { NativeMenuLabel } from "../../inputs/NativeMenu/NativeMenuLabel";
import { useCombatantContext } from "./CombatantContext";
import { useInititative } from "./useInititative";

export const ClassicInitiative = memo(function ClassicInitiative() {
  assertGame(game);
  const { combatant, combatantState } = useCombatantContext();
  assertClassicCombatant(combatant);
  const combat = combatant.combat;
  if (combat === null) {
    throw new Error(
      "ClassicInitiative must be rendered with a combatant that is in combat.",
    );
  }
  // from the combat's snapshot, so it follows the initiative being changed
  // anywhere
  const initiative =
    combatantState.type === "classic" ? combatantState.system.initiative : 0;

  const { onConfigureCombatant, onRemoveCombatant, localize, openSheet } =
    useInititative(combatant);

  const inputRef = useRef<HTMLInputElement>(null);
  const initString = initiative.toString();

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = initString;
    }
  }, [initString]);

  const onResetInitiative = useCallback(() => {
    void combatant.system.resetInitiative();
  }, [combatant]);

  const updateInitiative = () => {
    const value = inputRef.current?.value ?? "";
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      return;
    }
    void combat.updateEmbeddedDocuments("Combatant", [
      {
        _id: combatant.id,
        system: {
          initiative: parsedValue,
        },
      },
    ]);
  };

  return (
    <>
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
          css={{
            width: "2em",
            padding: "0.1em 0.2em",
            height: "1.8em",
            textAlign: "center",
            // fontSize: "0.8em",
            marginLeft: "0.5em",
            marginRight: "0.5em",
          }}
        />
      </form>

      {game.user.isGM && (
        <>
          <NativeDualFunctionMenu css={{ flex: 0, padding: "0 0.3em" }}>
            <NativeMenuLabel>{combatantState.name}</NativeMenuLabel>
            <NativeMenuItem icon={<FaEdit />} onSelect={onConfigureCombatant}>
              {localize("COMBATANT.ACTIONS.Update")}
            </NativeMenuItem>
            <NativeMenuItem icon={<FaRecycle />} onSelect={onResetInitiative}>
              {localize("investigator.RefreshInitiative")}
            </NativeMenuItem>
            <NativeMenuItem icon={<HiDocumentText />} onSelect={openSheet}>
              {localize("investigator.OpenCharacterSheet")}
            </NativeMenuItem>
            <NativeMenuItem icon={<FaTrash />} onSelect={onRemoveCombatant}>
              {localize("COMBATANT.ACTIONS.Remove")}
            </NativeMenuItem>
          </NativeDualFunctionMenu>
        </>
      )}
    </>
  );
});

ClassicInitiative.displayName = "ClassicInitiative";
