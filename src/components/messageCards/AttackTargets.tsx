import { useEffect, useReducer, useRef, useState } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import {
  applyAttackDamage,
  canUserActOnAttack,
} from "../../module/attacks/applyAttackDamage";
import {
  removeTarget,
  replaceTarget,
  setSingleTarget,
} from "../../module/attacks/attackData";
import {
  createAttackTarget,
  fillMissingDamageRolls,
  getAttackFlag,
  getTargetActor,
  pickSingleTargetToken,
  resolveTargetLive,
  setAttackFlag,
  showRolls,
} from "../../module/attacks/attackTargets";
import { getHealth } from "../../module/attacks/health";
import type { Cover, WoundState } from "../../module/attacks/rules";
import { getWoundState } from "../../module/attacks/rules";
import type {
  AttackFlagData,
  AttackTargetData,
} from "../../module/attacks/types";
import { Translate } from "../Translate";

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
 * Chat messages get re-rendered from scratch without unmounting the old React
 * root, so rather than relying on cleanup, listeners unhook themselves once
 * their element has left the DOM.
 */
function useRefreshOnDocumentChanges(ref: React.RefObject<HTMLElement | null>) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const hookNames = ["updateActor", "updateItem", "updateToken"] as const;
    const ids = hookNames.map((hookName) => {
      const id = Hooks.on(hookName, () => {
        if (ref.current && !ref.current.isConnected) {
          hookNames.forEach((name, i) => Hooks.off(name, ids[i]));
          return;
        }
        forceUpdate();
      });
      return id;
    });
    return () => {
      hookNames.forEach((name, i) => Hooks.off(name, ids[i]));
    };
  }, [ref]);
}

type AttackTargetRowProps = {
  msg: ChatMessage;
  attack: AttackFlagData;
  target: AttackTargetData;
  canAct: boolean;
  updateTarget: (
    targetId: string,
    update: Partial<AttackTargetData>,
  ) => Promise<void>;
};

const AttackTargetRow = ({
  msg,
  attack,
  target,
  canAct,
  updateTarget,
}: AttackTargetRowProps) => {
  assertGame(game);
  const actor = getTargetActor(target);
  const resolved = resolveTargetLive(attack, target);
  const isApplied = target.applied !== null;
  const canEdit = canAct && !isApplied;
  const canSeeHealth =
    actor?.testUserPermission(game.user, "OBSERVER") ?? false;
  const [busy, setBusy] = useState(false);

  const withBusy = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const onChangeCover = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void updateTarget(target.id, { cover: e.currentTarget.value as Cover });
  };

  const onChangeArmor = (e: React.FocusEvent<HTMLInputElement>) => {
    const text = e.currentTarget.value.trim();
    const armorOverride = text === "" ? null : Number(text);
    if (armorOverride !== null && Number.isNaN(armorOverride)) return;
    if (armorOverride === resolved.armor) return;
    void updateTarget(target.id, { armorOverride });
  };

  const onRollDamage = withBusy(async () => {
    const latest = getAttackFlag(msg);
    const latestTarget = latest?.targets.find((t) => t.id === target.id);
    if (!latest || !latestTarget) return;
    const filled = await fillMissingDamageRolls(latest, latestTarget);
    await showRolls(filled.rolls);
    await setAttackFlag(msg, replaceTarget(filled.attack, filled.target));
  });

  // when the GM is doing it for us, the card will re-render (and so reset)
  // once they have. Until then, stay busy so a double-click can't send a
  // second request - but not forever, in case the GM never answers.
  const applyOrUndo = (undo: boolean) => async () => {
    setBusy(true);
    let outcome: Awaited<ReturnType<typeof applyAttackDamage>> = "failed";
    try {
      outcome = await applyAttackDamage(msg, target, undo);
    } finally {
      if (outcome === "requested") {
        setTimeout(() => setBusy(false), gmRequestTimeoutMs);
      } else {
        setBusy(false);
      }
    }
  };
  const onApply = applyOrUndo(false);
  const onUndo = applyOrUndo(true);

  const onRemove = async () => {
    const latest = getAttackFlag(msg);
    if (!latest) return;
    await setAttackFlag(msg, removeTarget(latest, target.id));
  };

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

        {resolved.isHit && target.damageRolls.length > 0 && (
          <>
            <span className="label">
              <Translate>Damage</Translate>
            </span>
            <span>
              {target.damageRolls
                .slice(0, resolved.isCritical ? 2 : 1)
                .map((r) => r.total)
                .join(" + ")}
              {damage?.steps.map((step, i) => (
                <span key={i}>
                  {step.armorReduction > 0 && ` − ${step.armorReduction}`}
                  {step.gunfireExtra > 0 && (
                    <>
                      {` + ${step.gunfireExtra} `}(
                      <Translate>GunfireBonus</Translate>)
                    </>
                  )}
                </span>
              ))}
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
  const ref = useRef<HTMLDivElement>(null);
  useRefreshOnDocumentChanges(ref);
  const attack = getAttackFlag(msg);
  const canAct = canUserActOnAttack(game.user, msg) && msg.isOwner;

  const updateTarget = async (
    targetId: string,
    update: Partial<AttackTargetData>,
  ) => {
    const latest = getAttackFlag(msg);
    if (!latest) return;
    await setAttackFlag(msg, {
      ...latest,
      targets: latest.targets.map((t) =>
        t.id === targetId ? { ...t, ...update } : t,
      ),
    });
  };

  const onSetTarget = async () => {
    const latest = getAttackFlag(msg);
    if (!latest) return;
    const token = pickSingleTargetToken();
    if (!token) return;
    if (latest.targets.some((t) => t.tokenUuid === token.uuid)) return;
    const filled = await fillMissingDamageRolls(
      latest,
      setSingleTarget(latest, createAttackTarget(token)).targets[0],
    );
    await showRolls(filled.rolls);
    await setAttackFlag(msg, { ...filled.attack, targets: [filled.target] });
  };

  if (!attack) {
    return null;
  }

  return (
    <div ref={ref} css={{ marginTop: "0.5em" }}>
      {attack.targets.map((target) => (
        <AttackTargetRow
          key={target.id}
          msg={msg}
          attack={attack}
          target={target}
          canAct={canAct}
          updateTarget={updateTarget}
        />
      ))}
      {canAct && attack.targets.every((t) => t.applied === null) && (
        <div css={{ paddingTop: "0.4em", borderTop: "1px solid #0003" }}>
          <button type="button" onClick={onSetTarget}>
            <i className="fas fa-crosshairs" />{" "}
            <Translate>
              {attack.targets.length === 0 ? "Add target" : "Change target"}
            </Translate>
          </button>
        </div>
      )}
    </div>
  );
};

AttackTargets.displayName = "AttackTargets";
