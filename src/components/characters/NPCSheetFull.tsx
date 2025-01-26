import { produce } from "immer";
import { Fragment, ReactNode, useEffect, useState } from "react";

import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { settings } from "../../settings/settings";
import { assertNPCActor, isNPCActor } from "../../v10Types";
import { absoluteCover } from "../absoluteCover";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Button } from "../inputs/Button";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { NotesTypeContext } from "../NotesTypeContext";
import { TabContainer } from "../TabContainer";
import { Translate } from "../Translate";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { CharacterCombatAbilityPicker } from "./CharacterCombatAbilityPicker";
import { LogoEditable } from "./LogoEditable";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";
import { WeaponsArea } from "./Weapons/WeaponsArea";
import { WeaponsAreaEdit } from "./Weapons/WeaponsAreaEdit";

const settingsUseMwInjuryStatus = settings.useMwInjuryStatus.get;
const settingsUseNpcCombatBonuses = settings.useNpcCombatBonuses.get;
const settingsUseTurnPassing = settings.useTurnPassingInitiative.get;
const settingsNpcStats = settings.npcStats.get;

export const NPCSheetFull = () => {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);

  const [system, setSystem] = useState(actor.system);
  useEffect(() => {
    Hooks.on("updateActor", (affectedActor: Actor, changes: any) => {
      assertNPCActor(affectedActor);
      if (affectedActor.id !== actor.id) {
        return;
      }
      const newSystem = produce(system, () => {
        // assertNPCActor(affectedActor);
        return affectedActor.system;
      });
      setSystem(newSystem);
      affectedActor.system = newSystem;
    });
  }, [actor, system]);

  const themeName = actor.getSheetThemeName();
  const theme = useTheme(themeName);
  const stats = settingsNpcStats();

  return (
    <CSSReset
      theme={theme}
      mode="large"
      css={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        gridTemplateColumns: "max-content 1fr 4em",
        gap: "0.5em",
        gridTemplateAreas: '"sidebar title image" ' + '"sidebar main main" ',
      }}
    >
      <div
        css={{
          gridArea: "title",
          textAlign: "center",
          position: "relative",
        }}
      >
        <LogoEditable
          mainText={actor.name ?? ""}
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

      {/* SIDEBAR */}
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
        <Button onClick={actor.confirmRefresh} css={{ marginBottom: "0.5em" }}>
          <Translate>Full Refresh</Translate>
        </Button>

        {settingsUseMwInjuryStatus() && (
          <div css={{ marginBottom: "0.5em" }}>
            <MwInjuryStatusWidget
              status={actor.system.mwInjuryStatus}
              setStatus={actor.setMwInjuryStatus}
            />
          </div>
        )}

        {/* Stats */}
        <hr />
        {/* SotS NPC Combat bonus */}
        {settingsUseNpcCombatBonuses() && isNPCActor(actor) && (
          <Fragment>
            <h3 css={{ gridColumn: "start / end" }}>
              <Translate>Combat bonus</Translate>
            </h3>
            <AsyncNumberInput
              value={actor.system.combatBonus}
              onChange={actor.setCombatBonus}
            />
            <h3 css={{ gridColumn: "start / end" }}>
              <Translate>Damage bonus</Translate>
            </h3>
            <AsyncNumberInput
              value={actor.system.damageBonus}
              onChange={actor.setDamageBonus}
            />
          </Fragment>
        )}
        {Object.keys(stats).map<ReactNode>((key) => {
          return <StatField key={key} id={key} stat={stats[key]} />;
        })}

        <hr />
        <TrackersArea />
        <hr />
        <CharacterCombatAbilityPicker />
        {settingsUseTurnPassing() && (
          <Fragment>
            <h4 css={{ width: "8em" }}>
              <Translate>Number of turns</Translate>
            </h4>
            <AsyncNumberInput
              value={actor.system.initiativePassingTurns}
              onChange={actor.setPassingTurns}
            />
          </Fragment>
        )}
      </div>

      {/* MAIN TABS AREA */}
      <div
        css={{
          gridArea: "main",
          position: "relative",
          padding: "0.5em",
          overflow: "auto",
        }}
      >
        <TabContainer
          defaultTab="play"
          tabs={[
            {
              id: "play",
              label: "Play",
              content: (
                <Fragment>
                  <WeaponsArea />
                  <div css={{ height: "1em" }} />
                  <AbilitiesAreaPlay flipLeftRight={true} />
                </Fragment>
              ),
            },
            {
              id: "edit",
              label: "Edit",
              content: (
                <Fragment>
                  <WeaponsAreaEdit />
                  <div css={{ height: "1em" }} />
                  <AbilitiesAreaEdit npcMode />
                </Fragment>
              ),
            },
            {
              id: "notes",
              label: "Notes",
              content: (
                <InputGrid
                  css={{
                    ...absoluteCover,
                    gridTemplateRows: "1fr",
                    padding: "0.5em",
                  }}
                >
                  <NotesTypeContext.Provider value="npcNote">
                    <NotesEditorWithControls
                      allowChangeFormat
                      format={actor.system.notes.format}
                      html={actor.system.notes.html}
                      source={actor.system.notes.source}
                      onSave={actor.setNotes}
                    />
                  </NotesTypeContext.Provider>
                </InputGrid>
              ),
            },
            {
              id: "gmNotes",
              label: "GM Notes",
              content: (
                <InputGrid
                  css={{
                    ...absoluteCover,
                    gridTemplateRows: "1fr",
                    padding: "0.5em",
                  }}
                >
                  <NotesTypeContext.Provider value="npcNote">
                    <NotesEditorWithControls
                      allowChangeFormat
                      format={actor.system.gmNotes.format}
                      html={actor.system.gmNotes.html}
                      source={actor.system.gmNotes.source}
                      onSave={actor.setGMNotes}
                    />
                  </NotesTypeContext.Provider>
                </InputGrid>
              ),
            },
          ]}
        />
      </div>
    </CSSReset>
  );
};

NPCSheetFull.displayName = "NPCSheetFull";
