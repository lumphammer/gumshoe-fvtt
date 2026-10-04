import { useState } from "react";

import type { AttackMessage } from "../../module/attacks/attackTargets";
import { getBurstBulletsFiredLive } from "../../module/attacks/attackTargets";
import type { WalkingFirePayment } from "../../module/attacks/rules";
import { burstMaxBullets } from "../../module/attacks/rules";
import type { AttackData } from "../../module/attacks/types";
import {
  getWalkingFirePaymentsLive,
  walkFire,
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

  const onWalk = (payment: WalkingFirePayment) => async () => {
    setBusy(true);
    try {
      await walkFire(msg, payment);
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
