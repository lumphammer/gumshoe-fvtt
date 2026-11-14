import { memo } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertNPCActor } from "../../module/actors/npc";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";
import { Panel } from "../Panel";
import { css } from "../../styled-system/css";

// The NPC sheet's panels subscribe independently to the data they display.
// Foundry root re-renders are disabled; descendants keep themselves current.

/** The refresh button, for the strip at the top of the abilities tab */
export const NPCSheetRefreshButton = memo(function NPCSheetRefreshButton() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const { confirmRefresh } = useSystemMethods(actor);
  return (
    // as wide as its label, not the whole strip (componentDefaults.css)
    <Button
      onClick={confirmRefresh}
      className={css({ width: "auto", whiteSpace: "nowrap" })}
    >
      <Translate>Full Refresh</Translate>
    </Button>
  );
});

/** The name, and the portrait */
export const NPCSheetHeader = memo(function NPCSheetHeader() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const header = useActorSnapshot(actor, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
  }));

  return (
    <>
      <div
        className={css({
          gridArea: "title",
          textAlign: "center",
          position: "relative",
        })}
      >
        <LogoEditable
          mainText={header.name}
          onChangeMainText={actor.setName}
          className={css({
            fontSize: "0.66em",
          })}
        />
      </div>

      <ImagePickle
        img={header.img}
        className={css({
          gridArea: "image",
          transform: "rotateZ(2deg)",
          // over the sidebar (NPCSheetFull)
          "[data-inv-layout=full-frame] > &": { aspectRatio: "1" },
        })}
      />
    </>
  );
});

/** Refresh, combat bonuses, stats, pool trackers and initiative */
export const NPCSheetSidebar = memo(function NPCSheetSidebar() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const npc = useActorSnapshot(actor, ({ system }) => ({
    mwInjuryStatus: system.mwInjuryStatus,
    combatBonus: system.combatBonus,
    damageBonus: system.damageBonus,
    isHuman: system.isHuman,
    immuneToLethality: system.immuneToLethality,
    initiativePassingTurns: system.initiativePassingTurns,
  }));
  const s = useSettings((s) => ({
    useMwInjuryStatus: s.useMwInjuryStatus,
    useNpcCombatBonuses: s.useNpcCombatBonuses,
    useTurnPassingInitiative: s.useTurnPassingInitiative,
    npcStats: s.npcStats,
    showIsHuman: s.useDamageApplication && s.useGunfireOnHumans,
    showImmuneToLethality: s.useDamageApplication && s.useLethalityAndAutofire,
  }));
  const methods = useSystemMethods(actor);

  return (
    <Panel
      className={css({
        gridArea: "sidebar",
        position: "relative",
        overflowX: "visible",
        overflowY: "auto",
      })}
    >
      {s.useMwInjuryStatus && (
        <div className={css({ marginBottom: "0.5em" })}>
          <MwInjuryStatusWidget
            status={npc.mwInjuryStatus}
            setStatus={methods.setMwInjuryStatus}
          />
          <hr />
        </div>
      )}

      <TrackersArea />

      {/* Stats */}
      {/* SotS NPC Combat bonus */}
      {s.useNpcCombatBonuses && (
        <>
          <h3 className={css({ gridColumn: "start / end" })}>
            <Translate>Combat bonus</Translate>
          </h3>
          <AsyncNumberInput
            value={npc.combatBonus}
            onChange={methods.setCombatBonus}
          />
          <h3 className={css({ gridColumn: "start / end" })}>
            <Translate>Damage bonus</Translate>
          </h3>
          <AsyncNumberInput
            value={npc.damageBonus}
            onChange={methods.setDamageBonus}
          />
        </>
      )}
      {Object.keys(s.npcStats).map((key) => (
        <StatField key={key} id={key} stat={s.npcStats[key]} />
      ))}
      {/* the initiative ability is on the combat tab */}
      {s.useTurnPassingInitiative && (
        <>
          <h4 className={css({ width: "8em" })}>
            <Translate>Number of turns</Translate>
          </h4>
          <AsyncNumberInput
            value={npc.initiativePassingTurns}
            onChange={methods.setPassingTurns}
          />
        </>
      )}

      {/* Toggles */}
      {s.showIsHuman && (
        <>
          <h3 className={css({ gridColumn: "start / end" })}>
            <Translate>Human?</Translate>
          </h3>
          <Toggle checked={npc.isHuman} onChange={methods.setIsHuman} />
        </>
      )}
      {s.showImmuneToLethality && (
        <>
          <h3 className={css({ gridColumn: "start / end" })}>
            <Translate>Immune to Lethality?</Translate>
          </h3>
          <Toggle
            checked={npc.immuneToLethality}
            onChange={methods.setImmuneToLethality}
          />
        </>
      )}
    </Panel>
  );
});
