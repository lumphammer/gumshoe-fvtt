import type { ChangeEvent } from "react";
import { memo, useCallback, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import {
  isGeneralAbilitySnapshot,
  isInvestigativeAbilitySnapshot,
} from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import type { GeneralAbilityItem } from "../../module/items/generalAbility";
import type { InvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import type { MwRefreshGroup, SpecialitiesMode } from "../../types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { SituationalModifiersEditor } from "./SituationalModifiersEditor";
import { UnlocksEditor } from "./UnlocksEditor";

interface AbilityConfigProps {
  /** Only to write through: read from `ability`. */
  item: AbilityItem;
  ability: AbilitySnapshot;
}

export const AbilityConfig = memo(function AbilityConfig({
  item,
  ability,
}: AbilityConfigProps) {
  const isEditable = useIsEditable();
  const isGeneral = isGeneralAbilitySnapshot(ability);
  const system = ability.system;
  const methods = useSystemMethods(item);
  // the general and investigative abilities' own setters
  const generalMethods = useSystemMethods(item as GeneralAbilityItem);
  const investigativeMethods = useSystemMethods(
    item as InvestigativeAbilityItem,
  );
  const settings = useSettings((s) => ({
    useNpcCombatBonuses: s.useNpcCombatBonuses,
    useMwStyleAbilities: s.useMwStyleAbilities,
    categories: isGeneral
      ? s.generalAbilityCategories
      : s.investigativeAbilityCategories,
  }));

  const onClickDelete = useCallback(() => {
    const message = item.actor
      ? 'Delete {ActorName}\'s "{AbilityName}" ability?'
      : 'Delete the "{AbilityName}" ability?';

    void confirmADoodleDo({
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: {
        ActorName: item.actor?.name ?? "",
        AbilityName: item.name ?? "",
      },
    }).then((yes) => {
      if (yes) {
        void item.delete();
      }
    });
  }, [item]);

  const categories = settings.categories;

  const isRealCategory = categories.includes(system.categoryId);
  const [showCustomField, setShowCustomField] = useState(!isRealCategory);
  const [selectCustomOption, setSelectCustomOption] = useState(!isRealCategory);

  const { setCategoryId } = methods;
  const onChangeCategory = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value;
      if (value === "") {
        setShowCustomField(true);
        setSelectCustomOption(true);
      } else {
        setSelectCustomOption(false);
        void setCategoryId(e.currentTarget.value);
      }
    },
    [setCategoryId],
  );

  const selectedCat = selectCustomOption ? "" : system.categoryId;

  return (
    <InputGrid>
      <GridField label="Item Name">
        <AsyncTextInput value={ability.name} onChange={item.setName} />
      </GridField>
      <GridField label="Category">
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div>
            <select
              disabled={!isEditable}
              value={selectedCat}
              onChange={onChangeCategory}
              css={{
                lineHeight: "inherit",
                height: "inherit",
              }}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
              <option value="">Custom</option>
            </select>
          </div>
          <div
            css={{
              flex: 1,
            }}
          >
            {showCustomField && (
              <AsyncTextInput
                value={ability.system.categoryId}
                onChange={methods.setCategoryId}
              />
            )}
          </div>
        </div>
      </GridField>
      <GridField label="Min">
        <AsyncNumberInput
          max={ability.system.max}
          value={ability.system.min}
          onChange={methods.setMin}
        />
      </GridField>
      <GridField label="Max">
        <AsyncNumberInput
          min={ability.system.min}
          value={ability.system.max}
          onChange={methods.setMax}
        />
      </GridField>
      {settings.useNpcCombatBonuses && isGeneralAbilitySnapshot(ability) && (
        <>
          <GridField label="Combat bonus">
            <AsyncNumberInput
              value={ability.system.combatBonus}
              onChange={generalMethods.setCombatBonus}
            />
          </GridField>
          <GridField label="Damage bonus">
            <AsyncNumberInput
              value={ability.system.damageBonus}
              onChange={generalMethods.setDamageBonus}
            />
          </GridField>
        </>
      )}
      <GridField label="Has Specialities?">
        <Toggle
          checked={ability.system.hasSpecialities}
          onChange={(t) => {
            void methods.setHasSpecialities(t);
          }}
        />
      </GridField>
      {ability.system.hasSpecialities && (
        <GridField label="Specialities Mode">
          <Select
            value={ability.system.specialitiesMode}
            onChange={(t) => {
              void methods.setSpecialitiesMode(
                t.currentTarget.value as SpecialitiesMode,
              );
            }}
          >
            <option value="one">{getTranslated("One per rank")}</option>
            <option value="twoThreeFour">
              {getTranslated("+2/+3/+4 per rank")}
            </option>
          </Select>
        </GridField>
      )}
      <GridField label="Occupational?">
        <Toggle
          checked={ability.system.occupational}
          onChange={methods.setOccupational}
        />
      </GridField>
      {isGeneralAbilitySnapshot(ability) && (
        <GridField label="Can be investigative?">
          <Toggle
            checked={ability.system.canBeInvestigative}
            onChange={generalMethods.setCanBeInvestigative}
          />
        </GridField>
      )}
      <GridField label="Show tracker?">
        <Toggle
          checked={ability.system.showTracker}
          onChange={methods.setShowTracker}
        />
      </GridField>
      <GridField label="Exclude from general refresh?">
        <Toggle
          checked={ability.system.excludeFromGeneralRefresh}
          onChange={methods.setExcludeFromGeneralRefresh}
        />
      </GridField>
      <GridField label="Include in 24h refresh?">
        <Toggle
          checked={ability.system.refreshesDaily}
          onChange={methods.setRefreshesDaily}
        />
      </GridField>
      <GridField label="Hide if zero-rated?">
        <Toggle
          checked={ability.system.hideIfZeroRated}
          onChange={methods.setHideIfZeroRated}
        />
      </GridField>
      {isGeneralAbilitySnapshot(ability) && (
        <GridField label="Goes first in combat?">
          <Toggle
            checked={ability.system.goesFirstInCombat}
            onChange={generalMethods.setGoesFirstInCombat}
          />
        </GridField>
      )}
      {isGeneralAbilitySnapshot(ability) && (
        <GridField label="IsAPushPool">
          <Toggle
            checked={ability.system.isPushPool}
            onChange={generalMethods.setIsPushPool}
          />
        </GridField>
      )}
      <GridField label="AllowPoolToExceedRating">
        <Toggle
          checked={ability.system.allowPoolToExceedRating}
          onChange={methods.setAllowPoolToExceedRating}
        />
      </GridField>
      {isGeneralAbilitySnapshot(ability) && (
        <GridField
          label="Link to resource?"
          css={{ display: "flex", flexDirection: "row", gap: "0.5em" }}
        >
          <Toggle
            checked={ability.system.linkToResource}
            onChange={generalMethods.setLinkToResource}
          />
          {ability.system.linkToResource && (
            <AsyncTextInput
              value={ability.system.resourceId ?? ""}
              onChange={generalMethods.setResourceId}
            />
          )}
        </GridField>
      )}
      {isInvestigativeAbilitySnapshot(ability) && (
        <GridField label="IsQuickShock">
          <Toggle
            checked={ability.system.isQuickShock}
            onChange={investigativeMethods.setIsQuickShock}
          />
        </GridField>
      )}

      {settings.useMwStyleAbilities && isGeneralAbilitySnapshot(ability) && (
        <GridField label="Refresh group">
          <Select
            value={ability.system.mwRefreshGroup}
            onChange={(e) => {
              void generalMethods.setMwRefreshGroup(
                Number(e.currentTarget.value) as MwRefreshGroup,
              );
            }}
          >
            <option value="2">{getTranslated("XHours", { x: "2" })}</option>
            <option value="4">{getTranslated("XHours", { x: "4" })}</option>
            <option value="8">{getTranslated("XHours", { x: "8" })}</option>
          </Select>
        </GridField>
      )}
      <GridField label="Unlocks">
        <UnlocksEditor item={item} unlocks={system.unlocks} />
      </GridField>
      <GridField label="Situational Modifiers">
        <SituationalModifiersEditor
          item={item}
          situationalModifiers={system.situationalModifiers}
        />
      </GridField>
      <GridField label="Delete ability">
        <Button
          onClick={onClickDelete}
          css={{
            margin: 0,
          }}
        >
          <Translate>Delete</Translate>
        </Button>
      </GridField>
    </InputGrid>
  );
});
