import { memo, useCallback } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import * as c from "../../constants";
import { getRatingCapIn } from "../../module/actors/pcDerived";
import { isActiveCharacterActor } from "../../module/actors/types";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  getSpecialitiesOf,
  isInvestigativeAbilitySnapshot,
} from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button, ToolbarButton } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { AbilityBadges } from "./AbilityBadges";
import { SpecialityList } from "./SpecialityList";

interface AbilityMainBitsProps {
  /** Only to write through: read from `ability`. */
  item: AbilityItem;
  ability: AbilitySnapshot;
}

export const AbilityMainBits = memo(function AbilityMainBits({
  item,
  ability,
}: AbilityMainBitsProps) {
  const system = ability.system;
  const methods = useSystemMethods(item);
  const settings = useSettings((s) => s);
  const itemActor = item.actor;
  const fromActor = useActorSnapshot(itemActor, (actor) => ({
    initiativeAbility: isActiveCharacterActor(itemActor)
      ? (actor?.system as { initiativeAbility?: string } | undefined)
          ?.initiativeAbility
      : undefined,
    // rating caps come from a PC's adaptations, or Sanity's cap
    ratingCap:
      actor?.type === c.pc
        ? getRatingCapIn(actor, ability.name, settings)
        : null,
  }));

  const onClickRefresh = useCallback(() => {
    void methods.refreshPool();
  }, [methods]);

  const isCombatAbility = settings.combatAbilities.includes(ability.name);

  const itemName = ability.name;
  const isAbilityUsed = fromActor.initiativeAbility === itemName;
  const onClickUseForInitiative = useCallback(() => {
    if (!isActiveCharacterActor(itemActor)) return;
    void itemActor.update({
      system: {
        initiativeAbility: itemName,
      },
    });
  }, [itemActor, itemName]);

  const poolMax = settings.useMwStyleAbilities
    ? undefined
    : system.allowPoolToExceedRating
      ? system.max
      : system.rating;

  const isQuickShock =
    isInvestigativeAbilitySnapshot(ability) && ability.system.isQuickShock;

  const { setRatingAndRefreshPool } = methods;
  const handleQuickShockToggle = useCallback(
    (checked: boolean) => {
      void setRatingAndRefreshPool(checked ? 1 : 0);
    },
    [setRatingAndRefreshPool],
  );

  return (
    <InputGrid
      css={{
        flex: 1,
        gridTemplateRows: `${isQuickShock ? "2em" : "2em 2em"} ${isCombatAbility ? "2em" : ""} [notes] 1fr`,
        rowGap: "0.3em",
      }}
    >
      {isQuickShock && (
        <GridField label="Enabled">
          <Toggle
            checked={system.rating > 0}
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
                min={system.min}
                max={poolMax}
                value={system.pool}
                onChange={methods.setPool}
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
              max={fromActor.ratingCap ?? undefined}
              value={system.rating}
              onChange={methods.setRating}
            />
            <AbilityBadges
              css={{
                gridColumn: "1 / 4",
                justifyContent: "start",
                marginTop: "0.2em",
                // only when there are badges, to keep them off what's below
                "&:not(:empty)": { marginBottom: "0.5em" },
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
      <div
        css={{
          flex: 1,
          position: "relative",
          gridColumn: "1/-1",
        }}
      >
        <RichTextEditor
          name="notes"
          html={system.notes}
          onSave={methods.setNotes}
          css={{
            gridRow: "notes",
          }}
        />
      </div>
      {system.hasSpecialities && (
        <GridFieldStacked
          label={
            getSpecialitiesOf(system).length === 1
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
      {settings.useBoost && (
        <GridField label="Boost?">
          <Toggle checked={system.boost} onChange={methods.setBoost} />
        </GridField>
      )}
    </InputGrid>
  );
});
