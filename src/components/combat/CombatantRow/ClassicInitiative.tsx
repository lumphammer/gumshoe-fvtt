import { produce } from "immer";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FaEdit, FaRecycle, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";

import { assertGame } from "../../../functions/isGame";
import { assertClassicCombat } from "../../../module/combat/classicCombat";
import { ClassicCombatant } from "../../../module/combat/classicCombatant";
import {
  NativeDualFunctionMenu,
  NativeMenuItem,
} from "../../inputs/NativeMenu";
import { NativeMenuLabel } from "../../inputs/NativeMenu/NativeMenuLabel";
import { registerHookHandler } from "./registerHookHandler";
import { useInititative } from "./useInititative";

interface ClassicInitiativeProps {
  combatant: ClassicCombatant;
}

export const ClassicInitiative = memo(
  ({ combatant }: ClassicInitiativeProps) => {
    assertGame(game);
    const combat = combatant.combat;
    assertClassicCombat(combat);
    if (combat === null) {
      throw new Error(
        "ClassicInitiative must be rendered with a combatant that is in combat.",
      );
    }
    const [combatantSystemData, setCombatantSystemData] = useState(
      combatant.system.toJSON(),
    );

    useEffect(() => {
      return registerHookHandler(
        "updateCombatant",
        (updatedCombatant, changes) => {
          if (updatedCombatant !== combatant) return;
          if (!("system" in changes)) return;
          setCombatantSystemData((oldData) => {
            const systemChanges = changes.system;
            const newData = systemChanges
              ? produce(oldData, (draft) => {
                  foundry.utils.mergeObject(draft, systemChanges);
                })
              : oldData;
            return newData;
          });
        },
      );
    }, [combatant]);

    const { onConfigureCombatant, onRemoveCombatant, localize, openSheet } =
      useInititative(combatant);

    const inputRef = useRef<HTMLInputElement>(null);
    const initString = (combatantSystemData.initiative ?? 0).toString();

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
              <NativeMenuLabel>{combatant.name}</NativeMenuLabel>
              <NativeMenuItem icon={<FaEdit />} onSelect={onConfigureCombatant}>
                {localize("COMBAT.CombatantUpdate")}
              </NativeMenuItem>
              <NativeMenuItem icon={<FaRecycle />} onSelect={onResetInitiative}>
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
      </>
    );
  },
);

ClassicInitiative.displayName = "ClassicInitiative";
