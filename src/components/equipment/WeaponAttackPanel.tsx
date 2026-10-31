import { memo, type ReactNode, useCallback, useContext, useState } from "react";

import { getTranslated, getTranslatedOr } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import type { ItemSnapshot } from "../../hooks/useItemSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { useUserTargets } from "../../hooks/useUserTargets";
import { isPCActor } from "../../module/actors/pc";
import { isActiveCharacterActor } from "../../module/actors/types";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import {
  findGeneralAbilityIn,
  getPoolOf,
} from "../../module/items/findGeneralAbility";
import type { WeaponItem, WeaponSystemData } from "../../module/items/weapon";
import { ThemeContext } from "../../themes/ThemeContext";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button, ToolbarButton } from "../inputs/Button";
import { CheckButtons } from "../inputs/CheckButtons";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { EmbeddedItemSheetLink } from "../ItemSheetLink";
import { Translate } from "../Translate";
import type { ExtraSpend } from "./performAttack";
import { performAttack } from "./performAttack";
import type { FireMode } from "../../module/attacks/rules";
import {
  getAvailableFireModes,
  isMultiTargetFireMode,
  getMinimumSpend,
  getWastedExtraSpend,
  getSpendAfterRange,
} from "../../module/attacks/rules";
import { hasAmmoFor } from "./consumeWeaponAmmo";
import { Hint } from "../inputs/Hint";

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

/**
 * Who the attack will be at, to name on its button: the first target, unless
 * the fire mode spreads across all of them (only the first target is used
 * otherwise, with a warning). Any others are just counted, to keep the button
 * short.
 */
function getTargetsLabel(
  targets: TokenDocument[],
  fireMode: FireMode,
): string | null {
  const used = isMultiTargetFireMode(fireMode) ? targets : targets.slice(0, 1);
  if (used.length === 0) {
    return null;
  }
  const name = used[0].name ?? "";
  return used.length === 1
    ? name
    : getTranslated("NameAndCountMore", {
        Name: name,
        Count: String(used.length - 1),
      });
}

/** What the panel shows of an ability: picked out of the actor's snapshot */
type AbilityRef = { _id: string | null; name: string; pool: number };

/** The live item behind an `AbilityRef` */
const getLiveItem = (actor: Actor | null, ability: AbilityRef) =>
  actor?.items.get(ability._id ?? "") as InvestigatorItem | undefined;

/** Points spent from another ability (see `ExtraSpend`), as shown */
type ExtraSpendSnapshot = { ability: AbilityRef; spend: number };

const getSpendOptions = (available: number) =>
  defaultSpendOptions.map((option) => ({
    ...option,
    enabled: option.value <= available,
  }));

type WeaponAttackPanelProps = {
  weapon: WeaponItem;
};

/**
 * Everything for attacking with a weapon: fire mode, spends, range, the
 * attack button, ammo and initiative. Shown on the weapon's sheet and for the
 * ready weapon on a character's Combat tab.
 *
 * It reads the weapon, its actor and the settings through snapshots of its
 * own, so it works the same inside a converted sheet or not, and re-renders
 * only when something it shows changes (not for every item on the actor).
 * `weapon` is only used to write through, and to find live documents when
 * attacking.
 */
export const WeaponAttackPanel = memo(function WeaponAttackPanel({
  weapon: item,
}: WeaponAttackPanelProps) {
  const [spend, setSpend] = useState(0);
  const [bonusPool, setBonusPool] = useState(0);
  const [fireMode, setFireMode] = useState<FireMode>("single");
  const [rangeIndex, setRangeIndex] = useState(0);
  // spends from other abilities on full-auto, by ability name
  const [extraSpendsByName, setExtraSpendsByName] = useState<
    Record<string, number>
  >({});
  const theme = useContext(ThemeContext);

  // everything but the notes, which the panel doesn't show
  const weapon = useItemSelector(
    item,
    (snapshot: ItemSnapshot<WeaponSystemData>) => {
      const { notes: _notes, ...system } = snapshot.system;
      return { name: snapshot.name, system };
    },
  );
  const system = weapon.system;
  const { clearJam, setAmmo, reload } = useSystemMethods(item);
  const settings = useSettings((s) => ({
    useExtendedRange: s.useExtendedRange,
    useDamageApplication: s.useDamageApplication,
    useLethalityAndAutofire: s.useLethalityAndAutofire,
    useShotDryAndJams: s.useShotDryAndJams,
    fullAutoSpendAbilities: s.fullAutoSpendAbilities,
  }));
  const abilityName = system.ability;

  const fireModes = getAvailableFireModes({
    weaponFireModes: system.fireModes,
    useAutofire:
      settings.useDamageApplication && settings.useLethalityAndAutofire,
  });
  const effectiveFireMode: FireMode = fireModes.includes(fireMode)
    ? fireMode
    : fireModes[0];
  const isFullAuto = effectiveFireMode === "fullAuto";
  const minimumSpend = getMinimumSpend({
    fireMode: effectiveFireMode,
    weaponFireModes: system.fireModes,
  });

  // full-auto can also spend other abilities (Athletics and Stability in
  // FoDG), which count towards the minimum but don't add to the roll (p. 100).
  // Machine guns have no minimum, so there's no point.
  const needsExtraAbilities = isFullAuto && minimumSpend > 0;

  // the actor is the same object for the weapon's life; what's on it isn't
  // (pools can be spent elsewhere, e.g. the ability's own sheet). Select only
  // what's shown, so other changes to the actor don't re-render the panel
  const weaponActor = item.actor;
  const fromActor = useActorSnapshot(weaponActor, (actor) => {
    const find = (name: string): AbilityRef | undefined => {
      const found = actor ? findGeneralAbilityIn(actor.items, name) : undefined;
      return (
        found && { _id: found._id, name: found.name, pool: getPoolOf(found) }
      );
    };
    return {
      ability: find(abilityName),
      fullAutoAbilities: needsExtraAbilities
        ? settings.fullAutoSpendAbilities.flatMap((name) => find(name) ?? [])
        : [],
      initiativeAbility: isActiveCharacterActor(weaponActor)
        ? ((actor?.system as { initiativeAbility?: string } | undefined)
            ?.initiativeAbility ?? "")
        : "",
    };
  });
  const ability = fromActor.ability;
  const useExtendedRange = settings.useExtendedRange;
  const ranges = [
    {
      name: "point blank",
      label: getTranslatedOr("PointBlankShort", "Point Blank"),
      fullLabel: getTranslated("Point Blank"),
      enabled: system.isPointBlank,
      damage: system.pointBlankDamage,
      spend: system.pointBlankSpend,
    },
    {
      name: "close range",
      label: getTranslatedOr("CloseRangeShort", "Close Range"),
      fullLabel: getTranslated("Close Range"),
      enabled: system.isCloseRange,
      damage: system.closeRangeDamage,
      spend: system.closeRangeSpend,
    },
    {
      name: "near range",
      label: getTranslatedOr("NearRangeShort", "Near Range"),
      fullLabel: getTranslated("Near Range"),
      enabled: system.isNearRange,
      damage: system.nearRangeDamage,
      spend: system.nearRangeSpend,
    },
    {
      name: "long range",
      label: getTranslatedOr("LongRangeShort", "Long Range"),
      fullLabel: getTranslated("Long Range"),
      enabled: system.isLongRange,
      damage: system.longRangeDamage,
      spend: system.longRangeSpend,
    },
    ...(useExtendedRange
      ? [
          {
            name: "extended range",
            label: getTranslatedOr("ExtendedRangeShort", "Extended Range"),
            fullLabel: getTranslated("Extended Range"),
            enabled: system.isExtendedRange,
            damage: system.extendedRangeDamage,
            spend: system.extendedRangeSpend,
          },
        ]
      : []),
  ].map((range) => ({
    ...range,
    // range spends are part of the Extended Range rule
    spend: useExtendedRange ? range.spend : 0,
  }));
  const enabledRanges = ranges.filter((range) => range.enabled);
  // the picked range can be switched off in the config tab
  const effectiveRange = ranges[rangeIndex]?.enabled
    ? ranges[rangeIndex]
    : enabledRanges[0];
  // melee weapons only have point blank, so there's nothing to pick
  const isMeleeOnly =
    enabledRanges.length === 1 && enabledRanges[0] === ranges[0];

  // shooting at some ranges costs points, which don't add to the roll
  // (p. 098). They come out of the same pool, before the spend.
  const rangeSpend = effectiveRange?.spend ?? 0;
  const { rangeAffordable, available } = getSpendAfterRange({
    pool: ability?.pool ?? 0,
    bonusPool,
    rangeSpend,
  });
  const spendOptions = getSpendOptions(available);
  // if points get spent elsewhere, don't leave more selected than is left
  if (spend > available) {
    setSpend(available);
  }

  const extraAbilities = fromActor.fullAutoAbilities
    .filter((extra) => extra._id !== ability?._id)
    // in case a name is listed twice
    .filter(
      (extra, i, all) =>
        all.findIndex((other) => other._id === extra._id) === i,
    );
  const extraSpends: ExtraSpendSnapshot[] = extraAbilities.map((extra) => ({
    ability: extra,
    spend: Math.min(extraSpendsByName[extra.name] ?? 0, extra.pool),
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

  const ammoFail = !hasAmmoFor(system, effectiveFireMode);
  const isJammed =
    settings.useLethalityAndAutofire &&
    settings.useShotDryAndJams &&
    system.jammed;
  const spendTooLow = totalSpend < minimumSpend;

  const onAttack = () => {
    if (effectiveRange === undefined) {
      return;
    }
    // attack with the live documents (performAttack re-checks their pools)
    const liveExtraSpends = extraSpends.flatMap((extra): ExtraSpend[] => {
      const live = getLiveItem(weaponActor, extra.ability);
      return live ? [{ ability: live, spend: extra.spend }] : [];
    });
    void performAttack({
      spend,
      bonusPool,
      setSpend,
      setBonusPool,
      ability: ability && getLiveItem(weaponActor, ability),
      weapon: item,
      extraSpends: liveExtraSpends,
      resetExtraSpends: () => setExtraSpendsByName({}),
    })({
      rangeName: effectiveRange.name,
      rangeDamage: effectiveRange.damage,
      rangeSpend,
      fireMode: effectiveFireMode,
    });
  };

  const isAbilityUsed = fromActor.initiativeAbility === abilityName;

  const onClickUseForInitiative = useCallback(() => {
    void weaponActor?.update({
      system: {
        initiativeAbility: abilityName,
      },
    });
  }, [abilityName, weaponActor]);

  const activateButton = (
    <ToolbarButton onClick={onClickUseForInitiative}>
      <Translate>Activate</Translate>
    </ToolbarButton>
  );

  // everything which stops an attack, shown as hints below the attack button;
  // the first one is also the disabled attack button's tooltip
  const blockers: { key: string; message: string; action?: ReactNode }[] = [];
  // the configured ability can have been deleted or renamed, in which case
  // there's nothing to roll against
  if (ability === undefined) {
    blockers.push({
      key: "ability",
      message: weaponActor
        ? getTranslated("WeaponAbilityNotFound", { AbilityName: abilityName })
        : getTranslated("WeaponHasNoOwner"),
    });
  } else if (weaponActor && isPCActor(weaponActor) && !isAbilityUsed) {
    // a PC fights with their active initiative ability
    blockers.push({
      key: "initiative",
      message: getTranslated("WeaponAbilityNotActiveForInitiative", {
        AbilityName: abilityName,
      }),
      action: activateButton,
    });
  }
  if (isJammed) {
    blockers.push({
      key: "jammed",
      message: getTranslated("WeaponJammedHint"),
      action: (
        <Button onClick={clearJam}>
          <Translate>Clear jam</Translate>
        </Button>
      ),
    });
  }
  if (ammoFail) {
    blockers.push({
      key: "ammo",
      message: getTranslated(
        system.ammo.value > 0 ? "Not enough ammo" : "Out of ammo",
      ),
    });
  }
  if (spendTooLow) {
    blockers.push({
      key: "spend",
      message: getTranslated(
        isFullAuto ? "FullAutoNeedsSpendOfMin" : "BurstNeedsSpendOfMin",
        {
          Min: String(minimumSpend),
        },
      ),
    });
  }

  if (effectiveRange !== undefined && !rangeAffordable) {
    blockers.push({
      key: "rangeSpend",
      message: getTranslated("RangeNeedsSpendOfN", {
        Range: effectiveRange.fullLabel,
        N: String(rangeSpend),
      }),
    });
  }
  if (effectiveRange === undefined) {
    blockers.push({
      key: "range",
      message: getTranslated("WeaponHasNoRanges"),
    });
  }

  const attackTitle = blockers[0]?.message;

  const targets = useUserTargets();
  // attacks only use targets when damage is applied to them
  const targetsLabel = settings.useDamageApplication
    ? getTargetsLabel(targets, effectiveFireMode)
    : null;
  const attackLabel =
    targetsLabel === null
      ? getTranslated(isMeleeOnly ? "AttackWithWeaponName" : "FireWeaponName", {
          WeaponName: weapon.name,
        })
      : getTranslated(
          isMeleeOnly
            ? "AttackTargetsWithWeaponName"
            : "FireWeaponNameAtTargets",
          {
            WeaponName: weapon.name,
            Targets: targetsLabel,
          },
        );

  return (
    <>
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
                enabled: hasAmmoFor(system, mode),
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
          label={
            ability ? (
              <EmbeddedItemSheetLink
                actor={weaponActor}
                id={ability._id}
                name={ability.name}
              />
            ) : (
              "Spend"
            )
          }
          // not a <label> for the spends, so clicking the link only opens it
          noLabel
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
            key={extra.ability._id}
            label={
              <EmbeddedItemSheetLink
                actor={weaponActor}
                id={extra.ability._id}
                name={extra.ability.name}
              />
            }
            noLabel
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
              options={getSpendOptions(extra.ability.pool)}
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
                label:
                  range.spend > 0
                    ? `${range.label} · ${range.spend}`
                    : range.label,
                hover:
                  range.spend > 0
                    ? getTranslated("RangeCostsN", {
                        Range: range.fullLabel,
                        N: String(range.spend),
                      })
                    : range.fullLabel,
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
            {attackLabel}
          </Button>
        </GridFieldStacked>
        {/* All the sheet's warnings render here, in one place, just below
            the attack button so it doesn't move as hints come and go. */}
        {blockers.map((blocker) => (
          <GridFieldStacked key={blocker.key}>
            <Hint severity="danger" action={blocker.action}>
              {blocker.message}
            </Hint>
          </GridFieldStacked>
        ))}
        {wastedExtraSpend > 0 && (
          <GridFieldStacked>
            <Hint severity="warning">
              <Translate
                values={{
                  Wasted: String(wastedExtraSpend),
                  Min: String(minimumSpend),
                }}
              >
                WastedExtraSpend
              </Translate>
            </Hint>
          </GridFieldStacked>
        )}
      </InputGrid>
      <InputGrid css={{ rowGap: "0.3em" }}>
        <GridField label="Bonus pool">
          <AsyncNumberInput onChange={setBonusPool} value={bonusPool} />
        </GridField>

        {system.usesAmmo && (
          <GridField
            label={`${getTranslated("Ammo")}/${system.ammo.max}:`}
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
                max={system.ammo.max}
                value={system.ammo.value}
                onChange={setAmmo}
              />
              <Button
                css={{
                  flexBasis: "min-content",
                  flex: 0,
                  lineHeight: "inherit",
                }}
                onClick={reload}
              >
                <Translate>Reload</Translate>
              </Button>
            </div>
          </GridField>
        )}
      </InputGrid>
    </>
  );
});
