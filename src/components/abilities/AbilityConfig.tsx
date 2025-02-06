import { ChangeEvent, Fragment, useCallback, useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/utilities";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { settings } from "../../settings/settings";
import { MwRefreshGroup, SpecialitiesMode } from "../../types";
import {
  assertAbilityItem,
  isGeneralAbilityItem,
  isInvestigativeAbilityItem,
} from "../../v10Types";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { SituationalModifiersEditor } from "./SituationalModifiersEditor";
import { UnlocksEditor } from "./UnlocksEditor";

const settingsUseNpcCombatBonuses = settings.useNpcCombatBonuses.get;
const settingsUseMwStyleAbilities = settings.useMwStyleAbilities.get;

export const AbilityConfig = () => {
  const { item } = useItemSheetContext();
  assertGame(game);
  assertAbilityItem(item);
  const isGeneral = isGeneralAbilityItem(item);

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

  const categories = isGeneral
    ? settings.generalAbilityCategories.get()
    : settings.investigativeAbilityCategories.get();

  const isRealCategory = categories.includes(item.system.categoryId);
  const [showCustomField, setShowCustomField] = useState(!isRealCategory);
  const [selectCustomOption, setSelectCustomOption] = useState(!isRealCategory);

  const onChangeCategory = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value;
      if (value === "") {
        setShowCustomField(true);
        setSelectCustomOption(true);
      } else {
        setSelectCustomOption(false);
        void item.setCategoryId(e.currentTarget.value);
      }
    },
    [item],
  );

  const selectedCat = selectCustomOption ? "" : item.system.categoryId;

  return (
    <InputGrid>
      <GridField label="Item Name">
        <AsyncTextInput value={item.name ?? ""} onChange={item.setName} />
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
              value={selectedCat}
              onChange={onChangeCategory}
              css={{
                lineHeight: "inherit",
                height: "inherit",
              }}
            >
              {categories.map((cat: string) => (
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
                value={item.system.categoryId}
                onChange={item.setCategoryId}
              />
            )}
          </div>
        </div>
      </GridField>
      <GridField label="Min">
        <AsyncNumberInput
          max={item.system.max}
          value={item.system.min}
          onChange={item.setMin}
        />
      </GridField>
      <GridField label="Max">
        <AsyncNumberInput
          min={item.system.min}
          value={item.system.max}
          onChange={item.setMax}
        />
      </GridField>
      {settingsUseNpcCombatBonuses() && isGeneralAbilityItem(item) && (
        <Fragment>
          <GridField label="Combat bonus">
            <AsyncNumberInput
              value={item.system.combatBonus}
              onChange={item.setCombatBonus}
            />
          </GridField>
          <GridField label="Damage bonus">
            <AsyncNumberInput
              value={item.system.damageBonus}
              onChange={item.setDamageBonus}
            />
          </GridField>
        </Fragment>
      )}
      <GridField label="Has Specialities?">
        <Toggle
          checked={item.system.hasSpecialities}
          onChange={(t) => {
            void item.setHasSpecialities(t);
          }}
        />
      </GridField>
      {item.system.hasSpecialities && (
        <GridField label="Specialities Mode">
          <select
            value={item.system.specialitiesMode}
            onChange={(t) => {
              void item.setSpecialitiesMode(
                t.currentTarget.value as SpecialitiesMode,
              );
            }}
          >
            <option value="one">{getTranslated("One per rank")}</option>
            <option value="twoThreeFour">
              {getTranslated("+2/+3/+4 per rank")}
            </option>
          </select>
        </GridField>
      )}
      <GridField label="Occupational?">
        <Toggle
          checked={item.system.occupational}
          onChange={item.setOccupational}
        />
      </GridField>
      {isGeneralAbilityItem(item) && (
        <GridField label="Can be investigative?">
          <Toggle
            checked={item.system.canBeInvestigative}
            onChange={item.setCanBeInvestigative}
          />
        </GridField>
      )}
      <GridField label="Show tracker?">
        <Toggle
          checked={item.system.showTracker}
          onChange={item.setShowTracker}
        />
      </GridField>
      <GridField label="Exclude from general refresh?">
        <Toggle
          checked={item.system.excludeFromGeneralRefresh}
          onChange={item.setExcludeFromGeneralRefresh}
        />
      </GridField>
      <GridField label="Include in 24h refresh?">
        <Toggle
          checked={item.system.refreshesDaily}
          onChange={item.setRefreshesDaily}
        />
      </GridField>
      <GridField label="Hide if zero-rated?">
        <Toggle
          checked={item.system.hideIfZeroRated}
          onChange={item.setHideIfZeroRated}
        />
      </GridField>
      {isGeneralAbilityItem(item) && (
        <GridField label="Goes first in combat?">
          <Toggle
            checked={item.system.goesFirstInCombat}
            onChange={item.setGoesFirstInCombat}
          />
        </GridField>
      )}
      {isGeneralAbilityItem(item) && (
        <GridField label="IsAPushPool">
          <Toggle
            checked={item.system.isPushPool}
            onChange={item.setIsPushPool}
          />
        </GridField>
      )}
      <GridField label="AllowPoolToExceedRating">
        <Toggle
          checked={item.system.allowPoolToExceedRating}
          onChange={item.setAllowPoolToExceedRating}
        />
      </GridField>
      {isGeneralAbilityItem(item) && (
        <GridField
          label="Link to resource?"
          css={{ display: "flex", flexDirection: "row", gap: "0.5em" }}
        >
          <Toggle
            checked={item.system.linkToResource}
            onChange={item.setLinkToResource}
          />
          {item.system.linkToResource && (
            <AsyncTextInput
              value={item.system.resourceId ?? ""}
              onChange={item.setResourceId}
            />
          )}
        </GridField>
      )}
      {isInvestigativeAbilityItem(item) && (
        <GridField label="IsQuickShock">
          <Toggle
            checked={item.system.isQuickShock}
            onChange={item.setIsQuickShock}
          />
        </GridField>
      )}

      {settingsUseMwStyleAbilities() && isGeneralAbilityItem(item) && (
        <GridField label="Refresh group">
          <select
            value={item.system.mwRefreshGroup}
            onChange={(e) => {
              void item.setMwRefreshGroup(
                Number(e.currentTarget.value) as MwRefreshGroup,
              );
            }}
          >
            <option value="2">{getTranslated("XHours", { x: "2" })}</option>
            <option value="4">{getTranslated("XHours", { x: "4" })}</option>
            <option value="8">{getTranslated("XHours", { x: "8" })}</option>
          </select>
        </GridField>
      )}
      <GridField label="Unlocks">
        <UnlocksEditor />
      </GridField>
      <GridField label="Situational Modifiers">
        <SituationalModifiersEditor />
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
};
