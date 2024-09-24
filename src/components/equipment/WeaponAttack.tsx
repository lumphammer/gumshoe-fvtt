import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { generalAbility } from "../../constants";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import { ThemeContext } from "../../themes/ThemeContext";
import {
  ActorPayload,
  assertWeaponItem,
  isAbilityItem,
  isPCActor,
} from "../../v10Types";
import { absoluteCover } from "../absoluteCover";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { CheckButtons } from "../inputs/CheckButtons";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { Translate } from "../Translate";
import { performAttack } from "./performAttack";

const defaultSpendOptions = new Array(8).fill(null).map((_, i) => {
  const label = i.toString();
  return { label, value: Number(label), enabled: true };
});

export const WeaponAttack = () => {
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
    assertWeaponItem(item);
    void basePerformAttack({
      rangeName: "point blank",
      rangeDamage: item.system.pointBlankDamage,
    });
  }, [basePerformAttack, item]);

  const onCloseRange = useCallback(() => {
    assertWeaponItem(item);
    void basePerformAttack({
      rangeName: "close range",
      rangeDamage: item.system.closeRangeDamage,
    });
  }, [basePerformAttack, item]);

  const onNearRange = useCallback(() => {
    assertWeaponItem(item);
    void basePerformAttack({
      rangeName: "near range",
      rangeDamage: item.system.nearRangeDamage,
    });
  }, [basePerformAttack, item]);

  const onLongRange = useCallback(() => {
    assertWeaponItem(item);
    void basePerformAttack({
      rangeName: "long range",
      rangeDamage: item.system.longRangeDamage,
    });
  }, [basePerformAttack, item]);

  const weaponActor = item.actor;

  const [actorInitiativeAbility, setActorInitiativeAbility] = React.useState(
    weaponActor && isPCActor(weaponActor)
      ? weaponActor.system.initiativeAbility
      : "",
  );

  useEffect(() => {
    const callback = (
      actor: Actor,
      diff: ActorPayload,
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

  const isAbilityUsed = actorInitiativeAbility === ability?.name;
  const onClickUseForInitiative = useCallback(
    (e: React.MouseEvent) => {
      if (ability) {
        void item.actor?.update({
          system: {
            initiativeAbility: ability.name || "",
          },
        });
      }
    },
    [ability, item.actor],
  );

  const ammoFail = item.system.usesAmmo && item.system.ammo.value <= 0;

  return (
    <div css={{ ...absoluteCover, display: "flex", flexDirection: "column" }}>
      <InputGrid
        className={theme.panelClass}
        css={{
          padding: "1em",
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
          gridTemplateRows: `${item.system.usesAmmo ? "auto " : ""}1fr`,
        }}
      >
        {item.system.usesAmmo && (
          <GridField label="Ammo">
            <div
              css={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <Button
                css={{
                  flexBasis: "min-content",
                  flex: 0,
                  lineHeight: "inherit",
                }}
                onClick={item.reload}
              >
                <Translate>Reload</Translate>
              </Button>
              <AsyncNumberInput
                css={{ flex: 1 }}
                min={0}
                max={item.system.ammo.max}
                value={item.system.ammo.value}
                onChange={item.setAmmo}
              />
            </div>
          </GridField>
        )}

        <NotesEditorWithControls
          allowChangeFormat
          format={item.system.notes.format}
          html={item.system.notes.html}
          source={item.system.notes.source}
          onSave={item.setNotes}
        />
        <GridField label="Bonus pool">
          <AsyncNumberInput onChange={setBonusPool} value={bonusPool} />
        </GridField>
        <GridField noTranslate label={abilityName}>
          <a onClick={() => ability?.sheet?.render(true)}>
            <Translate values={{ AbilityName: ability?.name ?? "" }}>
              Open (ability name) ability
            </Translate>
          </a>
        </GridField>
        <GridField label="">
          {isAbilityUsed ? (
            <i>
              <Translate>
                This ability is currently being used for combat ordering
              </Translate>
            </i>
          ) : (
            <span>
              <a onClick={onClickUseForInitiative}>
                <Translate values={{ AbilityName: ability?.name ?? "" }}>
                  Use (ability name) for combat ordering
                </Translate>
              </a>{" "}
              (
              {actorInitiativeAbility ? (
                <Translate values={{ AbilityName: actorInitiativeAbility }}>
                  Currently using (ability name)
                </Translate>
              ) : (
                <Translate>Currently using nothing</Translate>
              )}
              )
            </span>
          )}
        </GridField>
        <GridField label="Cost">
          <AsyncNumberInput
            min={0}
            value={item.system.cost}
            onChange={item.setCost}
          />
        </GridField>
      </InputGrid>
    </div>
  );
};
