import { useCallback, useEffect, useState } from "react";

import { useItemSheetContext } from "../../hooks/useSheetContexts";
import {
  assertActiveCharacterActor,
  isActiveCharacterActor,
} from "../../module/actors/exports";
import { settings } from "../../settings/settings";
import { assertAbilityItem, isInvestigativeAbilityItem } from "../../v10Types";
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
    void item.refreshPool();
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

  const isAbilityUsed = actorInitiativeAbility === item.name;
  const onClickUseForInitiative = useCallback(() => {
    assertActiveCharacterActor(item?.actor);
    void item?.actor?.update({
      system: {
        initiativeAbility: item.name,
      },
    });
  }, [item?.actor, item.name]);

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
        void item.setRatingAndRefreshPool(1);
      } else {
        void item.setRatingAndRefreshPool(0);
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
                onChange={item.setPool}
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
              onChange={item.setRating}
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
        source={item.getNotes().source}
        format={item.getNotes().format}
        html={item.getNotes().html}
        // setSource={ability.setNotesSource}
        // setFormat={ability.setNotesFormat}
        allowChangeFormat
        onSave={item.setNotes}
        css={{
          gridRow: "notes",
        }}
      />
      {item.system.hasSpecialities && (
        <GridFieldStacked
          label={
            item.getSpecialities().length === 1 ? "Speciality" : "Specialities"
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
          <Toggle checked={item.system.boost} onChange={item.setBoost} />
        </GridField>
      )}
    </InputGrid>
  );
};

AbilityMainBits.displayName = "AbilityMainBits";
