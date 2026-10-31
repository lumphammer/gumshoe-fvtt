import { memo, useContext } from "react";

import * as c from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertNPCActor } from "../../module/actors/npc";
import { ThemeContext } from "../../themes/ThemeContext";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { OtherableDropDown } from "../inputs/OtherableDropDown";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";

// The NPC sheet's header and sidebar. Each is memoised, and reads the actor
// and settings through snapshots (as `PCSheetPanels.tsx` does for PCs), so
// Foundry's re-render of the sheet stops here. `ImagePickle` and `StatField`
// still read the live actor, and re-render with their section, which selects
// what they show.

/** The name, and the portrait */
export const NPCSheetHeader = memo(function NPCSheetHeader() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const header = useActorSnapshot(actor, (snapshot) => ({
    name: snapshot?.name ?? "",
    // `ImagePickle` reads it from the live actor: selected so this
    // re-renders when it changes
    img: snapshot?.img,
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
        css={{
          gridArea: "image",
          transform: "rotateZ(2deg)",
        }}
      />
    </>
  );
});

type NPCSidebarSystem = {
  mwInjuryStatus: unknown;
  combatBonus: number;
  damageBonus: number;
  isHuman: boolean;
  immuneToLethality: boolean;
  stats: Record<string, number>;
  initiativeAbility: string;
  initiativePassingTurns: number;
};

/** Refresh, combat bonuses, stats, pool trackers and initiative */
export const NPCSheetSidebar = memo(function NPCSheetSidebar() {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const theme = useContext(ThemeContext);
  const npc = useActorSnapshot(actor, (snapshot) => {
    const system = snapshot?.system as NPCSidebarSystem | undefined;
    return {
      mwInjuryStatus: (system?.mwInjuryStatus ??
        actor.system.mwInjuryStatus) as typeof actor.system.mwInjuryStatus,
      combatBonus: system?.combatBonus ?? 0,
      damageBonus: system?.damageBonus ?? 0,
      isHuman: system?.isHuman ?? false,
      immuneToLethality: system?.immuneToLethality ?? false,
      // `StatField` reads them from the live actor: selected here so this
      // re-renders when they change
      stats: system?.stats ?? {},
      initiativeAbility: system?.initiativeAbility ?? "",
      initiativePassingTurns: system?.initiativePassingTurns ?? 0,
      generalAbilityNames: (snapshot?.items ?? [])
        .filter((item) => item.type === c.generalAbility)
        .map((item) => item.name),
    };
  });
  const s = useSettings((s) => ({
    useMwInjuryStatus: s.useMwInjuryStatus,
    useNpcCombatBonuses: s.useNpcCombatBonuses,
    useTurnPassingInitiative: s.useTurnPassingInitiative,
    npcStats: s.npcStats,
    showIsHuman: s.useDamageApplication && s.useGunfireOnHumans,
    showImmuneToLethality: s.useDamageApplication && s.useLethalityAndAutofire,
    combatAbilities: s.combatAbilities,
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
      <div>
        <h3 css={{ gridColumn: "start / end" }}>
          <Translate>Initiative</Translate>
        </h3>
        <OtherableDropDown
          value={npc.initiativeAbility}
          onChange={methods.setInitiativeAbility}
          pickerValues={s.combatAbilities.toSorted()}
          validValues={npc.generalAbilityNames}
        />
      </div>
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
