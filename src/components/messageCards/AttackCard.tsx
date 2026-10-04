import React, { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { isAttackMessage } from "../../module/attacks/attackTargets";
import { formatLethality } from "../../module/attacks/lethality";
import type { FireMode } from "../../module/attacks/rules";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { settings } from "../../settings/settings";
import { Translate } from "../Translate";
import { AttackTargets } from "./AttackTargets";
import { DiceTerms } from "./DiceTerms";

const fireModeText: Record<FireMode, string> = {
  single: "FireModeSingle",
  burst: "FireModeBurst",
  fullAuto: "FireModeFullAuto",
};

interface AttackCardProps {
  msg: ChatMessage;
  weapon: InvestigatorItem | undefined;
  rangeName: string | null;
  name: string | null;
  imageUrl: string | null;
}

export const AttackCard = React.memo(
  ({ msg, rangeName, weapon, name, imageUrl }: AttackCardProps) => {
    const sheet = weapon?.sheet;

    const onClickWeaponName = useCallback(() => {
      if (!sheet) return;
      assertApplicationV2(sheet);
      void sheet.render({ force: true });
    }, [sheet]);

    const img = weapon?.img ?? imageUrl;

    // @ts-expect-error fvtt-types
    const poolRolls = msg.rolls?.[0]?.terms[0]?.rolls;
    const hitRoll = poolRolls[0];
    const damageRoll = poolRolls[1];

    const lethality =
      isAttackMessage(msg) && settings.useLethalityAndAutofire.get()
        ? msg.system.lethality
        : null;

    const fireMode = isAttackMessage(msg) ? msg.system.fireMode : "single";
    const isShotDry = isAttackMessage(msg) && msg.system.isShotDry;
    const weaponJammed = isAttackMessage(msg) && msg.system.weaponJammed;

    // older attack messages don't have targets at all
    const showTargets =
      isAttackMessage(msg) &&
      (settings.useDamageApplication.get() || msg.system.targets.length > 0);

    return (
      <>
        <div
          className="dice-roll"
          css={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            gridTemplateRows: "max-content minmax(0, max-content) max-content",
            gridTemplateAreas:
              '"image headline" ' +
              '"image hit-terms" ' +
              '"image hit-body" ' +
              '"image damage-terms" ' +
              '"image damage-body" ',
            alignItems: "center",
          }}
        >
          {/* IMAGE */}
          <div
            css={{
              height: "4em",
              width: "4em",
              gridArea: "image",
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              transform: "scale(0.9) rotate(-5deg)",
              boxShadow: "0 0 0.5em black",
              marginRight: "1em",
              alignSelf: "start",
            }}
          />
          {/* HEADLINE */}
          <div
            css={{
              gridArea: "headline",
            }}
          >
            <b>
              {sheet ? (
                <a onClick={onClickWeaponName}>{name ?? weapon?.name}</a>
              ) : (
                name
              )}
            </b>{" "}
            (<Translate>{rangeName || ""}</Translate>)
            {fireMode !== "single" && (
              <>
                {" · "}
                <Translate>{fireModeText[fireMode]}</Translate>
              </>
            )}
            {lethality && ` · ${formatLethality(lethality)}`}
          </div>
          {/* HIT TERMS */}

          <div
            css={{
              gridArea: "hit-terms",
            }}
          >
            <Translate>Hit roll</Translate>
            {": "}
            <DiceTerms terms={hitRoll.terms} />
            {" ="}
          </div>
          {/* HIT RESULT */}
          <a
            className="dice-total"
            css={{
              gridArea: "hit-body",
            }}
          >
            {hitRoll.total}
          </a>

          {/* DAMAGE TERMS */}

          <div
            css={{
              gridArea: "damage-terms",
            }}
          >
            <Translate>Damage</Translate>
            {": "}
            <DiceTerms terms={damageRoll.terms} />
            {" ="}
          </div>
          {/* DAMAGE RESULT */}
          <a
            className="dice-total"
            css={{
              gridArea: "damage-body",
            }}
          >
            {damageRoll.total}
          </a>
        </div>
        {isShotDry && (
          <div css={{ marginTop: "0.3em" }}>
            <i className="fas fa-exclamation-circle" />{" "}
            <b>
              <Translate>Shot dry</Translate>!
            </b>{" "}
            <Translate>ShotDryNotice</Translate>
          </div>
        )}
        {weaponJammed && (
          <div css={{ marginTop: "0.3em" }}>
            <i className="fas fa-exclamation-circle" />{" "}
            <b>
              <Translate>Jammed</Translate>!
            </b>{" "}
            <Translate>JammedNotice</Translate>
          </div>
        )}
        {showTargets && <AttackTargets msg={msg} />}
      </>
    );
  },
);

AttackCard.displayName = "AttackCard";
