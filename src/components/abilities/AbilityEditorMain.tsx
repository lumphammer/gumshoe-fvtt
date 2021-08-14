/** @jsx jsx */
import { jsx } from "@emotion/react";
import React, { useCallback } from "react";
import { useUpdate } from "../../hooks/useUpdate";
import { GumshoeItem } from "../../module/GumshoeItem";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { SpecialityList } from "./SpecialityList";
import { getCombatAbilities, getUseBoost } from "../../settingsHelpers";
import { Checkbox } from "../inputs/Checkbox";
import { Translate } from "../Translate";
import { assertAbilityDataSource, assertPCDataSource, isPCDataSource } from "../../types";

type AbilityEditorMainProps = {
  ability: GumshoeItem,
};

export const AbilityEditorMain: React.FC<AbilityEditorMainProps> = ({
  ability,
}) => {
  assertAbilityDataSource(ability.data);
  const updateRating = useCallback((rating) => {
    ability.setRating(rating);
  }, [ability]);
  const updatePool = useUpdate(ability, (pool) => ({ data: { pool } }));

  const onClickRefresh = useCallback(() => {
    ability.refreshPool();
  }, [ability]);

  const useBoost = getUseBoost();

  const isCombatAbility = getCombatAbilities().includes(ability.data.name);
  const actorInitiativeAbility = isPCDataSource(ability?.actor?.data) && ability?.actor?.data.data.initiativeAbility;
  const isAbilityUsed = actorInitiativeAbility === ability.name;
  const onClickUseForInitiative = useCallback(
    (e: React.MouseEvent) => {
      assertPCDataSource(ability?.actor?.data);
      ability?.actor?.update({
        data: {
          initiativeAbility: ability.data.name,
        },
      });
    },
    [ability?.actor, ability.data.name],
  );

  return (
    <InputGrid>
      <GridField label="Pool">
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <AsyncNumberInput
            min={0}
            max={ability.data.data.rating}
            value={ability.data.data.pool}
            onChange={updatePool}
            css={{
              flex: 1,
            }}
          />
          <button
            css={{
              flexBasis: "min-content",
              flex: 0,
              lineHeight: "inherit",
            }}
            onClick={onClickRefresh}
          >
            <Translate>Refresh</Translate>
          </button>
        </div>
      </GridField>
      <GridField label="Rating">
        <AsyncNumberInput
          min={0}
          value={ability.data.data.rating}
          onChange={updateRating}
        />
      </GridField>
      {ability.getHasSpecialities() &&
        <GridFieldStacked label={ability.getSpecialities().length === 1 ? "Speciality" : "Specialities"}>
          <div
            css={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <SpecialityList ability={ability} />
          </div>
        </GridFieldStacked>
      }
      {useBoost &&
        <GridField label="Boost?">
          <Checkbox checked={ability.getBoost()} onChange={ability.setBoost}/>
        </GridField>
      }
      {isCombatAbility &&
        <GridField label="Combat order">
          {isAbilityUsed
            ? (
            <i>
              This ability is currently being used for combat ordering
            </i>
              )
            : (
            <span>
              <a onClick={onClickUseForInitiative}>
                Use {ability.name} for combat ordering
              </a>{" "}
              (Currently using {actorInitiativeAbility || "nothing"})
            </span>
              )}
        </GridField>
      }
    </InputGrid>
  );
};
