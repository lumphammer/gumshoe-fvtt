import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { generalAbility } from "../../constants";
import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated } from "../../functions/getTranslated";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isPCActor } from "../../module/actors/pc";
import { isAbilityItem } from "../../module/items/exports";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { assertWeaponItem } from "../../module/items/weapon";
import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button, ToolbarButton } from "../inputs/Button";
import { CheckButtons } from "../inputs/CheckButtons";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { Translate } from "../Translate";
import { performAttack } from "./performAttack";

const defaultSpendOptions = Array.from({ length: 8 }, (_, value) => {
  const label = value.toString();
  return { label, value, enabled: true };
});

export const WeaponMain = () => {
  const { item } = useItemSheetContext();

  assertWeaponItem(item);
  const [spend, setSpend] = useState(0);
  const [bonusPool, setBonusPool] = useState(0);
  const theme = useContext(ThemeContext);

  const abilityName = item.system.ability;

  const ability: InvestigatorItem | undefined = item.actor?.items.find(
    (item: InvestigatorItem) => {
      return item.type === generalAbility && item.name === abilityName;
    },
  );

  const pool = ability && isAbilityItem(ability) ? ability.system.pool : 0;

  const spendOptions = defaultSpendOptions.map((option) => ({
    ...option,
    enabled: option.value <= pool + bonusPool,
  }));

  const basePerformAttack = useMemo(() => {
    return performAttack({
      spend,
      bonusPool,
      setSpend,
      setBonusPool,
      ability,
      weapon: item,
    });
  }, [ability, bonusPool, spend, item]);

  const onPointBlank = useCallback(() => {
    void basePerformAttack({
      rangeName: "point blank",
      rangeDamage: item.system.pointBlankDamage,
    });
  }, [basePerformAttack, item]);

  const onCloseRange = useCallback(() => {
    void basePerformAttack({
      rangeName: "close range",
      rangeDamage: item.system.closeRangeDamage,
    });
  }, [basePerformAttack, item]);

  const onNearRange = useCallback(() => {
    void basePerformAttack({
      rangeName: "near range",
      rangeDamage: item.system.nearRangeDamage,
    });
  }, [basePerformAttack, item]);

  const onLongRange = useCallback(() => {
    void basePerformAttack({
      rangeName: "long range",
      rangeDamage: item.system.longRangeDamage,
    });
  }, [basePerformAttack, item]);

  const weaponActor = item.actor;

  const [actorInitiativeAbility, setActorInitiativeAbility] = useState(
    weaponActor && isPCActor(weaponActor)
      ? weaponActor.system.initiativeAbility
      : "",
  );

  useEffect(() => {
    const callback = (
      actor: Actor,
      diff: unknown,
      options: unknown,
      id: string,
    ) => {
      if (actor.id === weaponActor?.id) {
        setActorInitiativeAbility(
          weaponActor && isPCActor(weaponActor)
            ? weaponActor.system.initiativeAbility
            : "",
        );
      }
    };
    Hooks.on("updateActor", callback);
    return () => {
      Hooks.off("updateActor", callback);
    };
  }, [weaponActor]);

  const isAbilityUsed = actorInitiativeAbility === abilityName;

  const onClickUseForInitiative = useCallback(() => {
    void item.actor?.update({
      system: {
        initiativeAbility: abilityName,
      },
    });
  }, [abilityName, item.actor]);

  const ammoFail = item.system.usesAmmo && item.system.ammo.value <= 0;

  const sheet = item.sheet;
  assertApplicationV2(sheet);

  return (
    <div css={{ ...absoluteCover, display: "flex", flexDirection: "column" }}>
      <InputGrid
        className={theme.panelClass}
        css={{
          padding: "0.5em",
          marginBottom: "0.5em",
          ...theme.panelStyleSecondary,
        }}
      >
        <GridField label="Spend">
          <CheckButtons
            onChange={setSpend}
            selected={spend}
            options={spendOptions}
          />
        </GridField>
        <GridFieldStacked>
          <div
            css={{
              display: "flex",
              flexDirection: "row",
              position: "relative",
            }}
          >
            {ammoFail && (
              <div
                css={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "1.2em",
                  backgroundColor: theme.colors.accentContrast,
                  color: theme.colors.accent,
                  padding: "0 1em",
                }}
              >
                <Translate>Out of ammo</Translate>
              </div>
            )}
            <Button
              css={{ lineHeight: 1, flex: 1 }}
              disabled={ammoFail || !item.system.isPointBlank}
              onClick={onPointBlank}
            >
              <Translate>Point Blank</Translate>
            </Button>
            <Button
              css={{ lineHeight: 1, flex: 1 }}
              disabled={ammoFail || !item.system.isCloseRange}
              onClick={onCloseRange}
            >
              <Translate>Close Range</Translate>
            </Button>
            <Button
              css={{ lineHeight: 1, flex: 1 }}
              disabled={ammoFail || !item.system.isNearRange}
              onClick={onNearRange}
            >
              <Translate>Near Range</Translate>
            </Button>
            <Button
              css={{ lineHeight: 1, flex: 1 }}
              disabled={ammoFail || !item.system.isLongRange}
              onClick={onLongRange}
            >
              <Translate>Long Range</Translate>
            </Button>
          </div>
        </GridFieldStacked>
      </InputGrid>
      <InputGrid
        css={{
          flex: 1,
          rowGap: "0.3em",
          gridTemplateRows: `auto ${item.system.usesAmmo ? "auto " : ""} ${item.actor ? "auto " : ""} 1fr`,
        }}
      >
        <GridField label="Bonus pool">
          <AsyncNumberInput onChange={setBonusPool} value={bonusPool} />
        </GridField>

        {item.system.usesAmmo && (
          <GridField
            label={`${getTranslated("Ammo")}/${item.system.ammo.max}:`}
            noTranslate
          >
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <AsyncNumberInput
                css={{ flex: 1 }}
                min={0}
                max={item.system.ammo.max}
                value={item.system.ammo.value}
                onChange={item.system.setAmmo}
              />
              <Button
                css={{
                  flexBasis: "min-content",
                  flex: 0,
                  lineHeight: "inherit",
                }}
                onClick={item.system.reload}
              >
                <Translate>Reload</Translate>
              </Button>
            </div>
          </GridField>
        )}

        {item.actor && (
          <GridField label="Initiative">
            <span css={{ display: "inline-block", paddingTop: "0.3em" }}>
              {/* Link to ability, if it exists */}
              {ability && (
                <a onClick={() => sheet.render({ force: true })}>
                  {ability?.name}{" "}
                </a>
              )}
              {/* Show "Not Found" if ability doesn't exist */}
              {ability === undefined && (
                <>
                  {abilityName}
                  <span
                    css={{
                      background: theme.colors.danger,
                      color: theme.colors.accentContrast,
                      display: "inline-block",
                      padding: "0 0.2em",
                      margin: "0 0.2em",
                      borderRadius: "0.2em",
                    }}
                  >
                    <Translate>NotFound!</Translate>
                  </span>{" "}
                </>
              )}
              {/* Show "Active" if ability is used */}
              {isAbilityUsed && (
                <>
                  (<Translate>Active</Translate> ✓){" "}
                </>
              )}
            </span>
            {/* Show "Activate" button if ability is not used */}
            {isAbilityUsed || (
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
          allowChangeFormat
          format={item.system.notes.format}
          html={item.system.notes.html}
          source={item.system.notes.source}
          onSave={item.system.setNotes}
        />
      </InputGrid>
    </div>
  );
};
