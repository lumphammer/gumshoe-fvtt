import { useState } from "react";

import type { AttackMessage } from "../../module/attacks/attackTargets";
import {
  getBurstBulletsFiredLive,
  pickSingleTargetToken,
} from "../../module/attacks/attackTargets";
import type { WalkingFirePayment } from "../../module/attacks/rules";
import { burstMaxBullets } from "../../module/attacks/rules";
import type { AttackData } from "../../module/attacks/types";
import { editAttack } from "../../module/attacks/editAttack";
import {
  getWalkingFirePaymentsLive,
  planWalkFire,
} from "../../module/attacks/walkingFire";
import { Translate } from "../Translate";

type WalkingFireActionsProps = {
  msg: AttackMessage;
  attack: AttackData;
};

/**
 * Buttons to walk the attack's fire onto another target (p. 100), one for
 * each way of paying for it.
 */
export const WalkingFireActions = ({
  msg,
  attack,
}: WalkingFireActionsProps) => {
  const [busy, setBusy] = useState(false);
  const options = getWalkingFirePaymentsLive(msg);
  if (!options) return null;

  const noBulletsLeft =
    attack.fireMode === "burst" &&
    getBurstBulletsFiredLive(attack) >= burstMaxBullets;

  // the target is whoever this user has targeted, and if it can't be done,
  // they're the one who needs to know why, so check here before asking
  const onWalk = (payment: WalkingFirePayment) => async () => {
    const token = pickSingleTargetToken();
    if (!token?.uuid) return;
    const plan = planWalkFire(msg, payment, token);
    if ("warning" in plan) {
      ui.notifications?.warn(plan.warning);
      return;
    }
    setBusy(true);
    try {
      await editAttack(msg, {
        kind: "walkFire",
        tokenUuid: token.uuid,
        payment,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div css={{ paddingTop: "0.4em", borderTop: "1px solid #0003" }}>
      <div css={{ marginBottom: "0.3em" }}>
        <i className="fas fa-person-walking-arrow-right" />{" "}
        <Translate>
          {noBulletsLeft ? "WalkFireNoBulletsLeft" : "WalkFireHint"}
        </Translate>
      </div>
      {/* once all three bullets have hit, there's nothing to walk */}
      {!noBulletsLeft && (
        <div
          css={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.3em",
          }}
        >
          {options.payments.map((payment) => (
            <button
              key={payment.other?.name ?? ""}
              type="button"
              disabled={busy || !payment.affordable}
              onClick={onWalk(payment)}
            >
              {`${payment.weaponSpend} ${options.weaponAbilityName}`}
              {payment.other &&
                ` + ${payment.other.spend} ${payment.other.name}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

WalkingFireActions.displayName = "WalkingFireActions";
