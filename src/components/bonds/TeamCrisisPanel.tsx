import { useState } from "react";
import { FaHeartCrack } from "react-icons/fa6";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import type { PCActor } from "../../module/actors/pc";
import type { CrisisChange } from "../../module/bonds/crisis";
import {
  crisisDifficulty,
  getBondAfterLoss,
  getTotalLosses,
  maxCrisisTeammates,
} from "../../module/bonds/crisis";
import { getMaxBondSpend, isBondBroken } from "../../module/bonds/rules";
import {
  getCrisisTeammateCandidates,
  planTeamCrisis,
  teamCrisis,
} from "../../module/bonds/teamCrisis";
import { Button } from "../inputs/Button";
import { Checkbox } from "../inputs/Checkbox";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { Hint } from "../inputs/Hint";
import { InputGrid } from "../inputs/InputGrid";
import { SpendButtons } from "../inputs/SpendButtons";
import { ItemSheetLink } from "../ItemSheetLink";
import { Translate } from "../Translate";

/** What a failure would do with one teammate, e.g. "new (2)" or "2 → 3" */
const describeChange = (change: CrisisChange) =>
  change.kind === "strengthen"
    ? `${change.bond.points} → ${change.after}`
    : `${getTranslated(change.kind === "new" ? "New" : "Reformed")} (${change.after})`;

type TeamCrisisPanelProps = {
  actor: PCActor;
  /** teammates to start ticked, e.g. from a GM's call */
  initialTeammateUuids?: string[];
  /** after the test: close the panel */
  onDone: () => void;
};

/**
 * The Stability test after a team crisis (Fall of DELTA GREEN, p. 046): pick
 * the teammates who were there, choose in advance which Bonds pay the cost
 * of a failure, then make the test. A nested panel on the Bonds tab, or a
 * window opened from a GM's call in chat.
 */
export const TeamCrisisPanel = ({
  actor,
  initialTeammateUuids = [],
  onDone,
}: TeamCrisisPanelProps) => {
  // the choices refer to other items and actors, which can change under us
  useRefreshOnActorItemChanges(actor);
  const [selected, setSelected] = useState<string[]>(() =>
    initialTeammateUuids.slice(0, maxCrisisTeammates),
  );
  const [stabilitySpend, setStabilitySpend] = useState(0);
  // points by Bond id
  const [bondSpends, setBondSpends] = useState<Record<string, number>>({});
  const [losses, setLosses] = useState<Record<string, number>>({});

  const stability = actor.system.getBondStabilityAbility();
  const bonds = actor.system.getBonds();
  const candidates = getCrisisTeammateCandidates(actor);
  const teammates = candidates.filter((c) => selected.includes(c.uuid ?? ""));
  const plan = planTeamCrisis(actor, teammates);
  const changesByUuid = new Map(plan.changes.map((c) => [c.teammate.uuid, c]));
  // only losses from Bonds which can still pay
  const currentLosses = Object.fromEntries(
    plan.candidates.map(({ bond }) => [bond.id, losses[bond.id] ?? 0]),
  );
  const allocated = getTotalLosses(currentLosses);

  const blocker =
    stability === undefined
      ? getTranslated("NoAbilityToBurnBondsFor")
      : teammates.length === 0
        ? getTranslated("ChooseTheTeammatesPresent")
        : allocated !== plan.lossesRequired
          ? getTranslated("ChooseWhereCountLostPointsComeFrom", {
              Count: String(plan.lossesRequired),
            })
          : undefined;

  const toggleTeammate = (uuid: string, checked: boolean) => {
    setSelected((current) =>
      checked
        ? current.length < maxCrisisTeammates && !current.includes(uuid)
          ? [...current, uuid]
          : current
        : current.filter((u) => u !== uuid),
    );
  };

  const onTest = async () => {
    // a spend breaks a Bond for sure; a loss only if the test fails
    const breaking = bonds.filter((bond) => {
      const after = getBondAfterLoss(
        bond.system.points - (bondSpends[bond.id ?? ""] ?? 0),
        currentLosses[bond.id ?? ""] ?? 0,
      );
      return !bond.system.isBroken && isBondBroken(after);
    });
    if (breaking.length > 0) {
      const yes = await confirmADoodleDo({
        message: "CrisisMayBreakBondsConfirm",
        confirmText: "Make the test",
        cancelText: "Cancel",
        confirmIconClass: "fa-dice",
        resolveFalseOnCancel: true,
        values: {
          BondNames: new Intl.ListFormat(game.i18n?.lang).format(
            breaking.map((bond) => bond.name ?? ""),
          ),
        },
      });
      if (!yes) {
        return;
      }
    }
    await teamCrisis(actor, {
      teammates,
      stabilitySpend,
      bondSpends: bonds.map((bond) => ({
        bond,
        spend: bondSpends[bond.id ?? ""] ?? 0,
      })),
      losses: currentLosses,
    });
    // the result is in chat, and on the Bonds tab
    onDone();
  };

  return (
    <div data-testid="team-crisis-panel">
      <h2>
        <Translate>Team Crisis</Translate>
      </h2>
      {/* outside the grid: spanning it, its width would squash the labels */}
      <p>
        <Translate
          values={{
            AbilityName: stability?.name ?? "",
            Difficulty: String(crisisDifficulty),
            Max: String(maxCrisisTeammates),
          }}
        >
          TeamCrisisHint
        </Translate>
      </p>
      <h3>
        <Translate>Teammates present</Translate>
      </h3>
      <InputGrid>
        {candidates.length === 0 && (
          <GridFieldStacked>
            <i>
              <Translate>No other characters</Translate>
            </i>
          </GridFieldStacked>
        )}
        {candidates.map((candidate) => {
          const change = changesByUuid.get(candidate.uuid ?? "");
          return (
            <GridField
              key={candidate.uuid}
              label={candidate.name ?? ""}
              noTranslate
            >
              <div
                data-testid="crisis-teammate"
                css={{ display: "flex", gap: "0.5em", alignItems: "center" }}
              >
                <Checkbox
                  checked={change !== undefined}
                  onChange={(checked) =>
                    toggleTeammate(candidate.uuid ?? "", checked)
                  }
                />
                {change && <span>{describeChange(change)}</span>}
              </div>
            </GridField>
          );
        })}
      </InputGrid>

      {plan.lossesOwed > 0 && (
        <>
          <h3>
            <Translate values={{ Count: String(plan.lossesRequired) }}>
              IfItFailsLoseCountPoints
            </Translate>
          </h3>
          {plan.lossesRequired < plan.lossesOwed && (
            <p>
              <Translate values={{ Count: String(plan.lossesOwed) }}>
                OnlyThisMuchOfCountCanBePaid
              </Translate>
            </p>
          )}
          <InputGrid>
            {plan.candidates.map(({ bond, maxLoss }) => {
              const item = bonds.find((b) => b.id === bond.id);
              const loss = currentLosses[bond.id] ?? 0;
              return (
                <GridField
                  key={bond.id}
                  label={item ? <ItemSheetLink item={item} /> : bond.name}
                  // a label would pass clicks on the link to the buttons
                  noLabel
                >
                  <SpendButtons
                    value={loss}
                    onChange={(points) =>
                      setLosses((current) => ({
                        ...current,
                        [bond.id]: points,
                      }))
                    }
                    // no more than it can lose, or than is still owed
                    max={Math.min(
                      maxLoss,
                      plan.lossesRequired - allocated + loss,
                    )}
                  />
                </GridField>
              );
            })}
          </InputGrid>
        </>
      )}

      <h3>
        <Translate>Spend</Translate>
      </h3>
      <InputGrid>
        {stability && (
          <GridField label={<ItemSheetLink item={stability} />} noLabel>
            <SpendButtons
              value={stabilitySpend}
              onChange={setStabilitySpend}
              max={stability.system.pool}
              disabled={stability.system.pool <= 0}
            />
          </GridField>
        )}
        {bonds.map((bond) => (
          <GridField
            key={bond.id}
            label={
              <>
                <ItemSheetLink item={bond} />
                {bond.system.isBroken && (
                  <>
                    {" "}
                    <FaHeartCrack
                      title={getTranslated("Broken")}
                      css={{ verticalAlign: "middle" }}
                    />
                  </>
                )}
              </>
            }
            noLabel
          >
            <SpendButtons
              value={bondSpends[bond.id ?? ""] ?? 0}
              onChange={(spend) =>
                setBondSpends((current) => ({
                  ...current,
                  [bond.id ?? ""]: spend,
                }))
              }
              max={getMaxBondSpend(bond.system.points)}
              disabled={bond.system.isBroken}
            />
          </GridField>
        ))}
        <GridFieldStacked>
          <Button
            onClick={onTest}
            disabled={blocker !== undefined}
            title={blocker}
          >
            <Translate title={blocker}>Make the test</Translate>{" "}
            <i className="fa fa-dice" />
          </Button>
        </GridFieldStacked>
        {/* below the button, as on the weapon sheet */}
        {blocker && (
          <GridFieldStacked>
            <Hint severity="danger">{blocker}</Hint>
          </GridFieldStacked>
        )}
      </InputGrid>
    </div>
  );
};

TeamCrisisPanel.displayName = "TeamCrisisPanel";
