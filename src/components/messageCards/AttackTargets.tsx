import { useEffect, useReducer, useState } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { canUserActOnAttack } from "../../module/attacks/applyAttackDamage";
import type {
  AttackEdit,
  TargetUpdate,
} from "../../module/attacks/attackEdits";
import {
  getAttackData,
  getTargetActor,
  isAttackMessage,
  pickSingleTargetToken,
  pickTargetTokens,
  resolveTargetLive,
} from "../../module/attacks/attackTargets";
import { editAttack } from "../../module/attacks/editAttack";
import { getHealth } from "../../module/attacks/health";
import type { LethalityOutcome } from "../../module/attacks/lethality";
import { formatLethality } from "../../module/attacks/lethality";
import type { DamageStep } from "../../module/attacks/resolveDamage";
import type { Cover, WoundState } from "../../module/attacks/rules";
import {
  canWalkFireFrom,
  getWoundState,
  isMultiTargetFireMode,
  shotDryMaxTargets,
} from "../../module/attacks/rules";
import type { AttackData, AttackTargetData } from "../../module/attacks/types";
import { settings } from "../../settings/settings";
import { Translate } from "../Translate";
import { WalkingFireActions } from "./WalkingFireActions";

/** how long to wait for the GM to apply damage before re-enabling buttons */
const gmRequestTimeoutMs = 5000;

const woundStateText: Record<WoundState, string> = {
  ok: "WoundStateOk",
  hurt: "WoundStateHurt",
  seriouslyWounded: "WoundStateSeriouslyWounded",
  dead: "WoundStateDead",
};

const coverText: Record<Cover, string> = {
  exposed: "CoverExposed",
  partial: "CoverPartial",
  full: "CoverFull",
};

/**
 * Re-render when actors, items, or tokens change, since the card shows live
 * Health, Hit Thresholds etc.
 */
function useRefreshOnDocumentChanges() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const hookNames = ["updateActor", "updateItem", "updateToken"] as const;
    const ids = hookNames.map((hookName) => Hooks.on(hookName, forceUpdate));
    return () => {
      hookNames.forEach((name, i) => Hooks.off(name, ids[i]));
    };
  }, []);
}

const GunfireText = ({ step }: { step: DamageStep }) =>
  step.gunfireExtra > 0 ? (
    <>
      {` + ${step.gunfireExtra} `}(<Translate>GunfireBonus</Translate>)
    </>
  ) : null;

const lethalityOutcomeText: Record<LethalityOutcome, string> = {
  dies: "LethalityDies",
  seriouslyWounded: "WoundStateSeriouslyWounded",
  hurt: "WoundStateHurt",
  damage: "",
};

/** e.g. "die 2: Seriously Wounded", or "die 3: 8 − 1" */
const LethalityStepText = ({ step }: { step: DamageStep }) => {
  const result = step.lethality;
  if (step.instance.kind !== "lethality" || !result) return null;
  return (
    <>
      <Translate values={{ Die: String(step.instance.die) }}>
        LethalityDieDie
      </Translate>
      {": "}
      {result.outcome === "damage" ? (
        <>
          {result.rolledDamage}
          {step.armorReduction > 0 && ` − ${step.armorReduction}`}
        </>
      ) : (
        <b>
          <Translate>{lethalityOutcomeText[result.outcome]}</Translate>
        </b>
      )}
      <GunfireText step={step} />
    </>
  );
};

type AttackTargetRowProps = {
  msg: ChatMessage;
  attack: AttackData;
  target: AttackTargetData;
  canAct: boolean;
};

const AttackTargetRow = ({
  msg,
  attack,
  target,
  canAct,
}: AttackTargetRowProps) => {
  assertGame(game);
  const actor = getTargetActor(target);
  const resolved = resolveTargetLive(attack, target);
  const isApplied = target.applied !== null;
  const canEdit = canAct && !isApplied;
  const canSeeHealth =
    actor?.testUserPermission(game.user, "OBSERVER") ?? false;
  const [busy, setBusy] = useState(false);

  // when the GM is doing it for us, the card will re-render (and so reset)
  // once they have. Until then, stay busy so a double-click can't send a
  // second request - but not forever, in case the GM never answers.
  const runEdit = async (edit: AttackEdit) => {
    setBusy(true);
    let outcome: Awaited<ReturnType<typeof editAttack>> = "failed";
    try {
      outcome = await editAttack(msg, edit);
    } finally {
      if (outcome === "requested") {
        setTimeout(() => setBusy(false), gmRequestTimeoutMs);
      } else {
        setBusy(false);
      }
    }
  };

  const updateTarget = (update: TargetUpdate) =>
    runEdit({ kind: "updateTarget", targetId: target.id, update });

  const onChangeCover = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void updateTarget({ cover: e.currentTarget.value as Cover });
  };

  const onChangeArmor = (e: React.FocusEvent<HTMLInputElement>) => {
    const text = e.currentTarget.value.trim();
    const armorOverride = text === "" ? null : Number(text);
    if (armorOverride !== null && Number.isNaN(armorOverride)) return;
    if (armorOverride === resolved.armor) return;
    void updateTarget({ armorOverride });
  };

  const onRollDamage = () =>
    runEdit({ kind: "rollDamage", targetId: target.id });
  const onApply = () =>
    runEdit({ kind: "applyDamage", targetId: target.id, undo: false });
  const onUndo = () =>
    runEdit({ kind: "applyDamage", targetId: target.id, undo: true });

  // Shot Dry's extra damage goes to a lone target automatically; with more,
  // the attacker picks up to two. Once any of those has had damage applied,
  // the choice is locked in.
  const shotDryChosenCount = attack.targets.filter(
    (t) => t.shotDryBonus,
  ).length;
  const shotDryLocked = attack.targets.some(
    (t) => t.shotDryBonus && t.applied !== null,
  );
  const canChooseShotDry =
    canEdit && attack.targets.length > 1 && !shotDryLocked;

  const onChangeShotDry = (e: React.ChangeEvent<HTMLInputElement>) => {
    void updateTarget({ shotDryBonus: e.currentTarget.checked });
  };

  const onRemove = () => runEdit({ kind: "removeTarget", targetId: target.id });

  const damage = resolved.damage;
  const shownHealth = isApplied
    ? target.applied?.newHealth
    : actor
      ? getHealth(actor)
      : null;

  const woundState = isApplied
    ? getWoundState(target.applied?.newHealth ?? 0)
    : (damage?.woundState ?? "ok");

  const action = !actor ? null : resolved.missingRollCount > 0 ? (
    canAct && (
      <button type="button" disabled={busy} onClick={onRollDamage}>
        <i className="fas fa-dice" /> <Translate>Roll damage</Translate>
      </button>
    )
  ) : isApplied ? (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.3em",
        alignItems: "center",
      }}
    >
      <span css={{ textAlign: "center" }}>
        <i className="fas fa-check" /> <Translate>Applied</Translate>
      </span>
      {canAct && (
        <button type="button" disabled={busy} onClick={onUndo}>
          <i className="fas fa-undo" /> <Translate>Undo</Translate>
        </button>
      )}
    </div>
  ) : (
    canAct &&
    damage && (
      <button type="button" disabled={busy} onClick={onApply}>
        <i className="fas fa-heart-broken" />{" "}
        <Translate>Apply damage</Translate>
      </button>
    )
  );

  return (
    <div
      css={{
        padding: "0.4em 0",
        borderTop: "1px solid #0003",
        opacity: actor ? 1 : 0.6,
      }}
    >
      {/* HEADER */}
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "2em 1fr max-content",
          columnGap: "0.5em",
          alignItems: "center",
          marginBottom: "0.3em",
        }}
      >
        <img
          src={target.img}
          alt=""
          css={{ width: "2em", height: "2em", border: "none" }}
        />
        <div>
          <b>{actor?.name ?? target.name}</b>
          {!actor && (
            <>
              {" "}
              (<Translate>Missing</Translate>)
            </>
          )}
          {target.walked && (
            <>
              {" "}
              (<Translate>Walked fire</Translate>)
            </>
          )}
        </div>
        <div>
          {canEdit && (
            <a onClick={onRemove} title={getTranslated("Remove target")}>
              <i className="fas fa-times" />
            </a>
          )}
        </div>
      </div>

      {/* DETAILS */}
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: "0.75em",
          rowGap: "0.2em",
          alignItems: "center",
          minHeight: "1.8em",
          "& > .label": {
            opacity: 0.75,
          },
        }}
      >
        <span className="label">
          <Translate>Cover</Translate>
        </span>
        <span>
          {canEdit ? (
            <select
              value={target.cover}
              onChange={onChangeCover}
              aria-label={getTranslated("CoverForTokenName", {
                TokenName: actor?.name ?? target.name,
              })}
              css={{ width: "100%" }}
            >
              {(Object.keys(coverText) as Cover[]).map((cover) => (
                <option key={cover} value={cover}>
                  {getTranslated(coverText[cover])}
                </option>
              ))}
            </select>
          ) : (
            <Translate>{coverText[target.cover]}</Translate>
          )}
        </span>

        <span className="label">
          <Translate>Hit threshold</Translate>
        </span>
        <span>
          {resolved.hitThreshold}:{" "}
          <b>
            <Translate>{resolved.isHit ? "Hit" : "Miss"}</Translate>
          </b>
          {resolved.isCritical && (
            <>
              {" "}
              (<Translate>Critical!</Translate>)
            </>
          )}
        </span>

        {resolved.isHit && (
          <>
            <span className="label">
              <Translate>Armor</Translate>
            </span>
            <span>
              {canEdit ? (
                <input
                  // remount when the value changes underneath us
                  key={resolved.armor}
                  type="number"
                  defaultValue={resolved.armor}
                  onBlur={onChangeArmor}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  css={{ width: "4em" }}
                />
              ) : (
                resolved.armor
              )}
            </span>
          </>
        )}

        {resolved.isHit && resolved.lethality && (
          <>
            <span className="label">
              <Translate>Lethality</Translate>
            </span>
            <span>{formatLethality(resolved.lethality)}</span>
          </>
        )}

        {resolved.isHit && attack.fireMode === "burst" && (
          <>
            <span className="label">
              <Translate>Bullets</Translate>
            </span>
            <span>{resolved.bulletCount}</span>
          </>
        )}

        {/* a chosen target which has become a miss stays here, so it can be
            unchosen to free up its slot */}
        {attack.isShotDry && (resolved.isHit || target.shotDryBonus) && (
          <>
            <span className="label">
              <Translate>Shot dry</Translate>
            </span>
            <span>
              {canChooseShotDry && (
                <input
                  type="checkbox"
                  checked={target.shotDryBonus}
                  disabled={
                    !target.shotDryBonus &&
                    shotDryChosenCount >= shotDryMaxTargets
                  }
                  onChange={onChangeShotDry}
                  aria-label={getTranslated("ShotDryChooseTarget", {
                    TokenName: actor?.name ?? target.name,
                  })}
                  css={{ margin: "0 0.4em 0 0", verticalAlign: "middle" }}
                />
              )}
              {resolved.shotDryExtraDice > 0 ? (
                <Translate values={{ N: String(resolved.shotDryExtraDice) }}>
                  ShotDryExtraDiceN
                </Translate>
              ) : (
                canChooseShotDry && <Translate>ShotDryChooseTargets</Translate>
              )}
            </span>
          </>
        )}

        {resolved.isHit && target.damageRolls.length > 0 && (
          <>
            <span className="label">
              <Translate>Damage</Translate>
            </span>
            <span>
              {resolved.missingRollCount > 0 ? (
                // waiting on more rolls (e.g. cover changed and now more
                // bullets hit), so show the ones we have so far
                resolved.lethality ? (
                  target.damageRolls.map((r, i) => (
                    <span key={i} css={{ display: "block" }}>
                      <Translate values={{ Die: String(r.die) }}>
                        LethalityDieDie
                      </Translate>
                    </span>
                  ))
                ) : (
                  target.damageRolls.map((r) => r.total).join(", ")
                )
              ) : !damage &&
                (resolved.lethality || resolved.instances.length > 1) ? (
                // no Health to resolve against, so just show what each
                // bullet rolled
                resolved.instances.map((instance, i) => (
                  <span key={i} css={{ display: "block" }}>
                    {resolved.bulletCount > 1 && (
                      <>
                        <Translate values={{ N: String(instance.bullet) }}>
                          BulletN
                        </Translate>
                        {": "}
                      </>
                    )}
                    {instance.kind === "lethality" ? (
                      <Translate values={{ Die: String(instance.die) }}>
                        LethalityDieDie
                      </Translate>
                    ) : (
                      instance.amount
                    )}
                  </span>
                ))
              ) : damage && (resolved.lethality || damage.steps.length > 1) ? (
                damage.steps.map((step, i) => (
                  <span key={i} css={{ display: "block" }}>
                    {resolved.bulletCount > 1 && (
                      <>
                        <Translate values={{ N: String(step.instance.bullet) }}>
                          BulletN
                        </Translate>
                        {": "}
                      </>
                    )}
                    {step.instance.kind === "lethality" ? (
                      <LethalityStepText step={step} />
                    ) : (
                      <>
                        {step.rolled}
                        {step.armorReduction > 0 && ` − ${step.armorReduction}`}
                        <GunfireText step={step} />
                      </>
                    )}
                  </span>
                ))
              ) : (
                <>
                  {target.damageRolls
                    .slice(0, resolved.isCritical ? 2 : 1)
                    .map((r) => r.total)
                    .join(" + ")}
                  {damage?.steps.map((step, i) => (
                    <span key={i}>
                      {step.armorReduction > 0 && ` − ${step.armorReduction}`}
                      <GunfireText step={step} />
                    </span>
                  ))}
                </>
              )}
            </span>
          </>
        )}

        {resolved.isHit && (damage || isApplied) && (
          <>
            <span className="label">
              <Translate>Health</Translate>
            </span>
            <span>
              {canSeeHealth && shownHealth !== null && (
                <>
                  {isApplied
                    ? `${target.applied?.previousHealth} → ${target.applied?.newHealth}`
                    : `${shownHealth} → ${damage?.finalHealth}`}{" "}
                </>
              )}
              <b>
                (<Translate>{woundStateText[woundState]}</Translate>)
              </b>
            </span>
          </>
        )}
      </div>

      {/* ACTION */}
      {resolved.isHit && action && (
        <div css={{ marginTop: "0.4em" }}>{action}</div>
      )}
    </div>
  );
};

type AttackTargetsProps = {
  msg: ChatMessage;
};

export const AttackTargets = ({ msg }: AttackTargetsProps) => {
  assertGame(game);
  useRefreshOnDocumentChanges();
  const attack = getAttackData(msg);
  const canAct = canUserActOnAttack(game.user, msg) && msg.isOwner;

  // which tokens are this user's targets, so work that out here
  const onAddTargets = async () => {
    const tokenUuids = pickTargetTokens().flatMap((token) =>
      token.uuid ? [token.uuid] : [],
    );
    if (tokenUuids.length === 0) return;
    await editAttack(msg, { kind: "addTargets", tokenUuids });
  };

  const onSetTarget = async () => {
    const tokenUuid = pickSingleTargetToken()?.uuid;
    if (!tokenUuid) return;
    await editAttack(msg, { kind: "setTarget", tokenUuid });
  };

  if (!attack) {
    return null;
  }

  const isMultiTarget = isMultiTargetFireMode(attack.fireMode);
  const canWalkFire =
    canAct &&
    settings.useLethalityAndAutofire.get() &&
    settings.useWalkingFire.get() &&
    canWalkFireFrom(attack.fireMode) &&
    attack.targets.length > 0;

  return (
    <div css={{ marginTop: "0.5em" }}>
      {attack.targets.map((target) => (
        <AttackTargetRow
          key={target.id}
          msg={msg}
          attack={attack}
          target={target}
          canAct={canAct}
        />
      ))}
      {/* once damage has been applied, the attack is done with */}
      {canAct &&
        isMultiTarget &&
        attack.targets.every((t) => t.applied === null) && (
          <div css={{ paddingTop: "0.4em", borderTop: "1px solid #0003" }}>
            <button type="button" onClick={onAddTargets}>
              <i className="fas fa-crosshairs" />{" "}
              <Translate>Add targets</Translate>
            </button>
          </div>
        )}
      {/* once fire has been walked, the targets are what was paid for */}
      {canAct &&
        !isMultiTarget &&
        attack.targets.length <= 1 &&
        !attack.targets.some((t) => t.walked) &&
        attack.targets.every((t) => t.applied === null) && (
          <div css={{ paddingTop: "0.4em", borderTop: "1px solid #0003" }}>
            <button type="button" onClick={onSetTarget}>
              <i className="fas fa-crosshairs" />{" "}
              <Translate>
                {attack.targets.length === 0 ? "Add target" : "Change target"}
              </Translate>
            </button>
          </div>
        )}
      {canWalkFire && isAttackMessage(msg) && (
        <WalkingFireActions msg={msg} attack={attack} />
      )}
    </div>
  );
};

AttackTargets.displayName = "AttackTargets";
