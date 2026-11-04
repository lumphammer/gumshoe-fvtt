import { memo, useContext } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertNPCActor } from "../../module/actors/npc";
import { ThemeContext } from "../../themes/ThemeContext";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { InitiativeAbilityPicker } from "./InitiativeAbilityPicker";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";

// The NPC sheet's panels subscribe independently to the data they display.
// Foundry root re-renders are disabled; descendants keep themselves current.

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
        css={{
          gridArea: "title",
          textAlign: "center",
          position: "relative",
        }}
      >
        <LogoEditable
          mainText={header.name}
          onChangeMainText={actor.setName}
          css={{
            fontSize: "0.66em",
          }}
        />
      </div>

      <ImagePickle
        img={header.img}
        css={{
          gridArea: "image",
          transform: "rotateZ(2deg)",
        }}
      />
    </>
  );
});

/** Refresh, combat bonuses, stats, pool trackers and initiative */
export const NPCSheetSidebar = memo(function NPCSheetSidebar() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const theme = useContext(ThemeContext);
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
    <div
      className={theme.panelClass}
      css={{
        gridArea: "sidebar",
        position: "relative",
        padding: "0.5em",
        overflowX: "visible",
        overflowY: "auto",
        ...theme.panelStylePrimary,
      }}
    >
      <Button onClick={methods.confirmRefresh} css={{ marginBottom: "0.5em" }}>
        <Translate>Full Refresh</Translate>
      </Button>

      {s.useMwInjuryStatus && (
        <div css={{ marginBottom: "0.5em" }}>
          <MwInjuryStatusWidget
            status={npc.mwInjuryStatus}
            setStatus={methods.setMwInjuryStatus}
          />
        </div>
      )}

      {/* Stats */}
      <hr />
      {/* SotS NPC Combat bonus */}
      {s.useNpcCombatBonuses && (
        <>
          <h3 css={{ gridColumn: "start / end" }}>
            <Translate>Combat bonus</Translate>
          </h3>
          <AsyncNumberInput
            value={npc.combatBonus}
            onChange={methods.setCombatBonus}
          />
          <h3 css={{ gridColumn: "start / end" }}>
            <Translate>Damage bonus</Translate>
          </h3>
          <AsyncNumberInput
            value={npc.damageBonus}
            onChange={methods.setDamageBonus}
          />
        </>
      )}
      {s.showIsHuman && (
        <>
          <h3 css={{ gridColumn: "start / end" }}>
            <Translate>Human?</Translate>
          </h3>
          <Toggle checked={npc.isHuman} onChange={methods.setIsHuman} />
        </>
      )}
      {s.showImmuneToLethality && (
        <>
          <h3 css={{ gridColumn: "start / end" }}>
            <Translate>Immune to Lethality?</Translate>
          </h3>
          <Toggle
            checked={npc.immuneToLethality}
            onChange={methods.setImmuneToLethality}
          />
        </>
      )}
      {Object.keys(s.npcStats).map((key) => (
        <StatField key={key} id={key} stat={s.npcStats[key]} />
      ))}

      <hr />
      <TrackersArea />
      <hr />
      <InitiativeAbilityPicker actor={actor} />
      {s.useTurnPassingInitiative && (
        <>
          <h4 css={{ width: "8em" }}>
            <Translate>Number of turns</Translate>
          </h4>
          <AsyncNumberInput
            value={npc.initiativePassingTurns}
            onChange={methods.setPassingTurns}
          />
        </>
      )}
    </div>
  );
});
