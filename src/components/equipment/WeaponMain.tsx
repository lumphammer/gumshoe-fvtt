import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated, getTranslatedOr } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isPCActor } from "../../module/actors/pc";
import { isAbilityItem } from "../../module/items/exports";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { findGeneralAbility } from "../../module/items/findGeneralAbility";
import { assertWeaponItem } from "../../module/items/weapon";
import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button, ToolbarButton } from "../inputs/Button";
import { CheckButtons } from "../inputs/CheckButtons";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Translate } from "../Translate";
import type { ExtraSpend } from "./performAttack";
import { performAttack } from "./performAttack";
import type { FireMode } from "../../module/attacks/rules";
import {
  getAvailableFireModes,
  getMinimumSpend,
  getWastedExtraSpend,
} from "../../module/attacks/rules";
import { settings } from "../../settings/settings";
import { hasAmmoFor } from "./consumeWeaponAmmo";
import { getWeaponHintColors, WeaponHint } from "./WeaponHint";

const defaultSpendOptions = Array.from({ length: 8 })
  .fill(null)
  .map((_, i) => {
    const label = i.toString();
    return { label, value: Number(label), enabled: true };
  });

const fireModeText: Record<FireMode, string> = {
  single: "FireModeSingle",
  burst: "FireModeBurst",
  fullAuto: "FireModeFullAuto",
};

const getPool = (ability: InvestigatorItem | undefined) =>
  ability && isAbilityItem(ability) ? ability.system.pool : 0;

const getSpendOptions = (available: number) =>
  defaultSpendOptions.map((option) => ({
    ...option,
    enabled: option.value <= available,
  }));

export const WeaponMain = () => {
  const { item } = useItemSheetContext();

  assertWeaponItem(item);
  const [spend, setSpend] = useState(0);
  const [bonusPool, setBonusPool] = useState(0);
  const [fireMode, setFireMode] = useState<FireMode>("single");
  const [rangeIndex, setRangeIndex] = useState(0);
  // spends from other abilities on full-auto, by ability name
  const [extraSpendsByName, setExtraSpendsByName] = useState<
    Record<string, number>
  >({});
  const theme = useContext(ThemeContext);

  const abilityName = item.system.ability;

  // pools can be spent elsewhere (e.g. the ability's own sheet)
  useRefreshOnActorItemChanges(item.actor);

  const ability = findGeneralAbility(item.actor, abilityName);
  const available = getPool(ability) + bonusPool;
  const spendOptions = getSpendOptions(available);
  // if points get spent elsewhere, don't leave more selected than is left
  if (spend > available) {
    setSpend(available);
  }

  const fireModes = getAvailableFireModes({
    weaponFireModes: item.system.fireModes,
    useAutofire:
      settings.useDamageApplication.get() &&
      settings.useLethalityAndAutofire.get(),
  });
  const effectiveFireMode: FireMode = fireModes.includes(fireMode)
    ? fireMode
    : fireModes[0];
  const isFullAuto = effectiveFireMode === "fullAuto";
  const minimumSpend = getMinimumSpend({
    fireMode: effectiveFireMode,
    weaponFireModes: item.system.fireModes,
  });

  // full-auto can also spend other abilities (Athletics and Stability in
  // FoDG), which count towards the minimum but don't add to the roll (p. 100).
  // Machine guns have no minimum, so there's no point.
  const extraAbilities =
    isFullAuto && minimumSpend > 0
      ? settings.fullAutoSpendAbilities
          .get()
          .map((name) => findGeneralAbility(item.actor, name))
          .filter(
            (extra): extra is InvestigatorItem =>
              extra !== undefined && extra !== ability,
          )
          // in case a name is listed twice
          .filter((extra, i, all) => all.indexOf(extra) === i)
      : [];
  const extraSpends: ExtraSpend[] = extraAbilities.map((extra) => ({
    ability: extra,
    spend: Math.min(extraSpendsByName[extra.name] ?? 0, getPool(extra)),
  }));
  const extraSpendTotal = extraSpends.reduce(
    (total, extra) => total + extra.spend,
    0,
  );
  const totalSpend = spend + extraSpendTotal;
  const wastedExtraSpend = getWastedExtraSpend({
    spend,
    extraSpend: extraSpendTotal,
    minimumSpend,
  });

  const ammoFail = !hasAmmoFor(item.system, effectiveFireMode);
  const isJammed =
    settings.useLethalityAndAutofire.get() &&
    settings.useShotDryAndJams.get() &&
    item.system.jammed;
  const spendTooLow = totalSpend < minimumSpend;
  const spendLabel = extraSpends.length > 0 ? ability?.name : undefined;

  const ranges = [
    {
      name: "point blank",
      label: getTranslatedOr("PointBlankShort", "Point Blank"),
      fullLabel: getTranslated("Point Blank"),
      enabled: item.system.isPointBlank,
      damage: item.system.pointBlankDamage,
    },
    {
      name: "close range",
      label: getTranslatedOr("CloseRangeShort", "Close Range"),
      fullLabel: getTranslated("Close Range"),
      enabled: item.system.isCloseRange,
      damage: item.system.closeRangeDamage,
    },
    {
      name: "near range",
      label: getTranslatedOr("NearRangeShort", "Near Range"),
      fullLabel: getTranslated("Near Range"),
      enabled: item.system.isNearRange,
      damage: item.system.nearRangeDamage,
    },
    {
      name: "long range",
      label: getTranslatedOr("LongRangeShort", "Long Range"),
      fullLabel: getTranslated("Long Range"),
      enabled: item.system.isLongRange,
      damage: item.system.longRangeDamage,
    },
  ];
  const enabledRanges = ranges.filter((range) => range.enabled);
  // the picked range can be switched off in the config tab
  const effectiveRange = ranges[rangeIndex]?.enabled
    ? ranges[rangeIndex]
    : enabledRanges[0];
  // melee weapons only have point blank, so there's nothing to pick
  const isMeleeOnly =
    enabledRanges.length === 1 && enabledRanges[0] === ranges[0];

  const onAttack = () => {
    if (effectiveRange === undefined) {
      return;
    }
    void performAttack({
      spend,
      bonusPool,
      setSpend,
      setBonusPool,
      ability,
      weapon: item,
      extraSpends,
      resetExtraSpends: () => setExtraSpendsByName({}),
    })({
      rangeName: effectiveRange.name,
      rangeDamage: effectiveRange.damage,
      fireMode: effectiveFireMode,
    });
  };

  const weaponActor = item.actor;

  const [actorInitiativeAbility, setActorInitiativeAbility] = useState(
    weaponActor && isPCActor(weaponActor)
      ? weaponActor.system.initiativeAbility
      : "",
  );

  useEffect(() => {
    const callback = (actor: Actor) => {
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

  // everything which stops an attack, shown as hints below the attack button;
  // the first one is also the disabled attack button's tooltip
  const blockers: { key: string; message: string; action?: ReactNode }[] = [];
  // the configured ability can have been deleted or renamed, in which case
  // there's nothing to roll against
  if (ability === undefined) {
    blockers.push({
      key: "ability",
      message: item.actor
        ? getTranslated("WeaponAbilityNotFound", { AbilityName: abilityName })
        : getTranslated("WeaponHasNoOwner"),
    });
  }
  if (isJammed) {
    blockers.push({
      key: "jammed",
      message: getTranslated("WeaponJammedHint"),
      action: (
        <Button onClick={item.system.clearJam}>
          <Translate>Clear jam</Translate>
        </Button>
      ),
    });
  }
  if (ammoFail) {
    blockers.push({
      key: "ammo",
      message: getTranslated(
        item.system.ammo.value > 0 ? "Not enough ammo" : "Out of ammo",
      ),
    });
  }
  if (spendTooLow) {
    blockers.push({
      key: "spend",
      message: getTranslated(
        isFullAuto ? "FullAutoNeedsSpendOfMin" : "BurstNeedsSpendOfMin",
        { Min: String(minimumSpend) },
      ),
    });
  }

  if (effectiveRange === undefined) {
    blockers.push({
      key: "range",
      message: getTranslated("WeaponHasNoRanges"),
    });
  }

  const attackTitle = blockers[0]?.message;

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
        {fireModes.length > 1 && (
          <GridField label="Fire mode">
            <CheckButtons
              size={1}
              onChange={(index) => setFireMode(fireModes[index])}
              selected={fireModes.indexOf(effectiveFireMode)}
              options={fireModes.map((mode, index) => ({
                label: getTranslated(fireModeText[mode]),
                value: index,
                enabled: hasAmmoFor(item.system, mode),
              }))}
            />
          </GridField>
        )}
        {fireModes.length === 1 && effectiveFireMode !== "single" && (
          <GridField label="Fire mode">
            <span css={{ display: "inline-block", paddingTop: "0.3em" }}>
              <Translate>{fireModeText[effectiveFireMode]}</Translate>
            </span>
          </GridField>
        )}
        {/* alongside other abilities' spends, name the ability being spent */}
        <GridField
          label={spendLabel ?? "Spend"}
          noTranslate={spendLabel !== undefined}
        >
          <CheckButtons
            size={1}
            onChange={setSpend}
            selected={spend}
            options={spendOptions}
          />
        </GridField>
        {extraSpends.map((extra) => (
          <GridField
            key={extra.ability.id}
            label={extra.ability.name}
            noTranslate
          >
            <CheckButtons
              size={1}
              onChange={(value) =>
                setExtraSpendsByName((spends) => ({
                  ...spends,
                  [extra.ability.name]: value,
                }))
              }
              selected={extra.spend}
              options={getSpendOptions(getPool(extra.ability))}
            />
          </GridField>
        ))}
        {!isMeleeOnly && (
          <GridField label="Range">
            <CheckButtons
              size={1}
              onChange={setRangeIndex}
              selected={effectiveRange ? ranges.indexOf(effectiveRange) : -1}
              options={ranges.map((range, index) => ({
                label: range.label,
                hover: range.fullLabel,
                value: index,
                enabled: range.enabled,
              }))}
            />
          </GridField>
        )}
        <GridFieldStacked>
          <Button
            css={{ lineHeight: 1.5, margin: 0 }}
            disabled={blockers.length > 0}
            title={attackTitle}
            onClick={onAttack}
          >
            {getTranslated(
              isMeleeOnly ? "AttackWithWeaponName" : "FireWeaponName",
              { WeaponName: item.name },
            )}
          </Button>
        </GridFieldStacked>
        {/* All the sheet's warnings render here, in one place, just below
            the attack button so it doesn't move as hints come and go. */}
        {blockers.map((blocker) => (
          <GridFieldStacked key={blocker.key}>
            <WeaponHint severity="danger" action={blocker.action}>
              {blocker.message}
            </WeaponHint>
          </GridFieldStacked>
        ))}
        {wastedExtraSpend > 0 && (
          <GridFieldStacked>
            <WeaponHint severity="warning">
              <Translate
                values={{
                  Wasted: String(wastedExtraSpend),
                  Min: String(minimumSpend),
                }}
              >
                WastedExtraSpend
              </Translate>
            </WeaponHint>
          </GridFieldStacked>
        )}
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
                <a
                  onClick={() => {
                    const sheet = ability.sheet;
                    assertApplicationV2(sheet);
                    void sheet.render({ force: true });
                  }}
                >
                  {ability.name}{" "}
                </a>
              )}
              {/* Show "Not Found" if ability doesn't exist */}
              {ability === undefined && (
                <>
                  {abilityName}
                  <span
                    css={{
                      ...getWeaponHintColors(theme, "danger"),
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
        <div
          css={{
            flex: 1,
            position: "relative",
            gridColumn: "1/-1",
          }}
        >
          <RichTextEditor
            name="notes"
            html={item.system.notes}
            onSave={item.system.setNotes}
          />
        </div>
      </InputGrid>
    </div>
  );
};
