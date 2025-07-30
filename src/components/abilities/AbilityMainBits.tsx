import { useCallback, useEffect, useState } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import {
  assertActiveCharacterActor,
  isActiveCharacterActor,
} from "../../module/actors/types";
import { assertAbilityItem } from "../../module/items/exports";
import { isInvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import { settings } from "../../settings/settings";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button, ToolbarButton } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { AbilityBadges } from "./AbilityBadges";
import { SpecialityList } from "./SpecialityList";

const settingsUseBoost = settings.useBoost.get;
const settingsUseMwStyleAbilities = settings.useMwStyleAbilities.get;

export const AbilityMainBits = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);

  const onClickRefresh = useCallback(() => {
    void item.system.refreshPool();
  }, [item]);

  const useBoost = settingsUseBoost();

  const isCombatAbility = settings.combatAbilities
    .get()
    .includes(item.name ?? "");

  const [actorInitiativeAbility, setActorInitiativeAbility] = useState(
    isActiveCharacterActor(item?.actor) &&
      item?.actor?.system.initiativeAbility,
  );

  useEffect(() => {
    const callback = (
      actor: Actor,
      diff: unknown,
      options: unknown,
      id: string,
    ) => {
      if (actor.id === item?.actor?.id) {
        setActorInitiativeAbility(
          isActiveCharacterActor(item?.actor) &&
            item?.actor?.system.initiativeAbility,
        );
      }
    };
    Hooks.on("updateActor", callback);
    return () => {
      Hooks.off("updateActor", callback);
    };
  }, [item?.actor]);

  // breaking these out into vars allows the react-hooks eslint rule to
  // understand what's happening. if the callback has dependencies on
  // item?.actor it gets all upset.
  const itemActor = item.actor;
  const itemName = item.name ?? "";

  const isAbilityUsed = actorInitiativeAbility === item.name;
  const onClickUseForInitiative = useCallback(() => {
    assertActiveCharacterActor(itemActor);
    void itemActor?.update({
      system: {
        initiativeAbility: itemName,
      },
    });
  }, [itemActor, itemName]);

  const useMwStyleAbilities = settingsUseMwStyleAbilities();

  const poolMax = useMwStyleAbilities
    ? undefined
    : item.system.allowPoolToExceedRating
      ? item.system.max
      : item.system.rating;

  const isQuickShock =
    isInvestigativeAbilityItem(item) && item.system.isQuickShock;

  const handleQuickShockToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        void item.system.setRatingAndRefreshPool(1);
      } else {
        void item.system.setRatingAndRefreshPool(0);
      }
    },
    [item],
  );

  return (
    <InputGrid
      css={{
        flex: 1,
        gridTemplateRows: "auto auto auto auto [notes] 1fr",
        rowGap: "0.3em",
      }}
    >
      {isQuickShock && (
        <GridField label="Enabled">
          <Toggle
            checked={item.system.rating > 0}
            onChange={handleQuickShockToggle}
          />
        </GridField>
      )}
      {!isQuickShock && (
        <>
          <GridField label="Pool">
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <AsyncNumberInput
                min={item.system.min}
                max={poolMax}
                value={item.system.pool}
                onChange={item.system.setPool}
                css={{
                  flex: 1,
                }}
              />
              <Button
                css={{
                  flexBasis: "min-content",
                  flex: 0,
                  lineHeight: "inherit",
                }}
                onClick={onClickRefresh}
              >
                <Translate>Refresh</Translate>
              </Button>
            </div>
          </GridField>
          <GridField label="Rating">
            <AsyncNumberInput
              min={0}
              value={item.system.rating}
              onChange={item.system.setRating}
            />
            <AbilityBadges
              css={{
                gridColumn: "1 / 4",
                justifyContent: "start",
                marginBottom: "0",
                marginTop: "0.2em",
              }}
              ability={item}
            />
          </GridField>
        </>
      )}
      {isCombatAbility && (
        <GridField label="Initiative">
          {isAbilityUsed ? (
            <span css={{ display: "inline-block", paddingTop: "0.2em" }}>
              <Translate>Active</Translate> ✓
            </span>
          ) : (
            <ToolbarButton
              css={{ display: "inline", marginLeft: "0.5em" }}
              onClick={onClickUseForInitiative}
            >
              Activate
            </ToolbarButton>
          )}
        </GridField>
      )}

      <NotesEditorWithControls
        source={item.system.notes.source}
        format={item.system.notes.format}
        html={item.system.notes.html}
        // setSource={ability.setNotesSource}
        // setFormat={ability.setNotesFormat}
        allowChangeFormat
        onSave={item.system.setNotes}
        css={{
          gridRow: "notes",
        }}
      />
      {item.system.hasSpecialities && (
        <GridFieldStacked
          label={
            item.system.getSpecialities().length === 1
              ? "Speciality"
              : "Specialities"
          }
        >
          <div
            css={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <SpecialityList ability={item} />
          </div>
        </GridFieldStacked>
      )}
      {useBoost && (
        <GridField label="Boost?">
          <Toggle checked={item.system.boost} onChange={item.system.setBoost} />
        </GridField>
      )}
    </InputGrid>
  );
};

AbilityMainBits.displayName = "AbilityMainBits";
