/** @jsx jsx */
import { Fragment, ReactNode, useCallback } from "react";
import { InvestigatorActor } from "../../module/InvestigatorActor";
import { jsx } from "@emotion/react";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { BuildPointArea } from "./BuildPointArea";
import { CSSReset, CSSResetMode } from "../CSSReset";
import { LogoEditable } from "./LogoEditable";
import { InputGrid } from "../inputs/InputGrid";
import { GridField } from "../inputs/GridField";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { TabContainer } from "../TabContainer";
import { EquipmentArea } from "./EquipmentArea";
import { NotesArea } from "./NotesArea";
import { WeaponsArea } from "./WeaponsArea";
import { SettingArea } from "./SettingsArea";
import { ActorSheetAppContext } from "../FoundryAppContext";
import { TrackersArea } from "./TrackersArea";
import { Translate } from "../Translate";
import { assertPCDataSource, isPCDataSource } from "../../types";
import { ImagePickle } from "../ImagePickle";
import { assertGame } from "../../functions";
import { AbilitiesAreaMW } from "./MoribundWorld/AbilitiesAreaMW";
import { MwItemArea } from "./MoribundWorld/MwItemArea";
import { CombatAbilityDropDown } from "../inputs/CombatAbilityDropDown";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { settings } from "../../settings";
import { StatField } from "./StatField";

type InvestigatorPCSheetProps = {
  actor: InvestigatorActor,
  foundryApplication: ActorSheet,
}

export const InvestigatorPCSheet = ({
  actor,
  foundryApplication,
}: InvestigatorPCSheetProps) => {
  assertGame(game);
  assertPCDataSource(actor.data);

  const updateShortNote = useCallback((value, index) => {
    actor.setShortNote(index, value);
  }, [actor]);

  const updateMwHiddenShortNote = useCallback((value, index) => {
    actor.setMwHiddenShortNote(index, value);
  }, [actor]);

  const theme = actor.getSheetTheme();
  const shortNotesNames = settings.shortNotes.get();
  const shortHiddenNotesNames = settings.mwHiddenShortNotes.get();
  const occupationLabel = settings.occupationLabel.get();
  const stats = settings.pcStats.get();

  return (
    <ActorSheetAppContext.Provider value={foundryApplication}>
      <CSSReset
        theme={theme}
        mode={CSSResetMode.large}
        css={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          display: "grid",
          gridTemplateRows: "min-content max-content 1fr",
          gridTemplateColumns: "10em 1fr 10em",
          gap: "0.5em",
          gridTemplateAreas:
            "\"title title image\" " +
            "\"pools stats image\" " +
            "\"pools body  body\" ",
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
            mainText={actor.data.name}
            subText={actor.data.data.occupation}
            defaultSubText={settings.genericOccupation.get()}
            onChangeMainText={actor.setName}
            onChangeSubText={actor.setOccupation}
          />
        </div>
        <ImagePickle
          subject={actor}
          application={foundryApplication}
          css={{
            gridArea: "image",
            transform: "rotateZ(2deg)",
          }}
        />

        <div
          className={theme.panelClass}
          css={{
            gridArea: "stats",
            padding: "0.5em",
            position: "relative",
            ...theme.panelStyleSecondary,
          }}
        >
          <InputGrid>
          <GridField label="Name">
              <AsyncTextInput
                value={actor.data.name}
                onChange={actor.setName}
              />
            </GridField>
            <GridField noTranslate label={occupationLabel}>
              <AsyncTextInput
                value={actor.data.data.occupation}
                onChange={actor.setOccupation}
              />
            </GridField>
            {
              shortNotesNames.map((name: string, i: number) => (
                <GridField noTranslate key={`${name}--${i}`} label={name}>
                  <AsyncTextInput
                    value={isPCDataSource(actor.data) ? actor.data.data.shortNotes[i] : ""}
                    onChange={updateShortNote}
                    index={i}
                  />
                </GridField>
              ))
            }
            {
              game.user?.isGM && shortHiddenNotesNames.map((name: string, i: number) => (
                <GridField noTranslate key={`${name}--${i}`} label={name}>
                  <AsyncTextInput
                    value={isPCDataSource(actor.data) ? actor.data.data.hiddenShortNotes[i] : ""}
                    onChange={updateMwHiddenShortNote}
                    index={i}
                  />
                </GridField>
              ))
            }
          </InputGrid>
        </div>

        <div
          className={theme.panelClass}
          css={{
            gridArea: "pools",
            position: "relative",
            overflowX: "visible",
            overflowY: "auto",
            padding: "0.5em",
            ...theme.panelStylePrimary,
          }}
          >
            {settings.useMwStyleAbilities.get() &&
              <Fragment>
              <button onClick={actor.confirmMw2Refresh}>
                <Translate>2h Refresh</Translate>
              </button>
              <hr/>
              <button onClick={actor.confirmMw4Refresh}>
                <Translate>4h Refresh</Translate>
              </button>
              <hr/>
              <button onClick={actor.confirmMw8Refresh}>
                <Translate>8h Refresh</Translate>
              </button>
              <hr/>
              </Fragment>
            }
            <button onClick={actor.confirmRefresh}>
              <Translate>Full Refresh</Translate>
            </button>
            <hr/>
            {settings.useMwStyleAbilities.get() ||
              <Fragment>
                <button onClick={actor.confirm24hRefresh}>
                  <Translate>24h Refresh</Translate>
                </button>
                <hr/>
              </Fragment>
            }
            {settings.useMwInjuryStatus.get() &&
              <Fragment>
                <MwInjuryStatusWidget
                  status={actor.getMwInjuryStatus()}
                  setStatus={actor.setMwInjuryStatus}
                />
                <hr/>
              </Fragment>
            }
            <TrackersArea actor={actor} />
            <hr/>
            {
              Object.keys(stats).map<ReactNode>((key) => {
                return (<StatField key={key} id={key} actor={actor} stat={stats[key]} />);
              })
            }
            <hr/>
            <h3 css={{ gridColumn: "start / end" }}>
              <Translate>Combat Order</Translate>
            </h3>
            <CombatAbilityDropDown
              value={actor.getInitiativeAbility()}
              onChange={actor.setInitiativeAbility}
            />
        </div>

        <div
          css={{
            gridArea: "body",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <TabContainer
            defaultTab="abilities"
            tabs={[
              {
                id: "abilities",
                label: "Abilities",
                content: settings.useMwStyleAbilities.get() ? <AbilitiesAreaMW actor={actor}/> : <AbilitiesAreaPlay actor={actor}/>,
              },
              settings.mwUseAlternativeItemTypes.get()
                ? {
                    id: "items",
                    label: "MWItems",
                    content: (
                      <MwItemArea actor={actor} />
                    ),
                  }
                : {
                    id: "equipment",
                    label: "Equipment",
                    content: (
                      <Fragment>
                        <WeaponsArea actor={actor} />
                        <div css={{ height: "1em" }}/>
                        <EquipmentArea actor={actor} />
                      </Fragment>
                    ),
                  },
              {
                id: "notes",
                label: "Notes",
                content: (
                  <NotesArea actor={actor} />
                ),
              },
              {
                id: "abilities-edit",
                label: "Edit",
                content:
                  <Fragment>
                    <BuildPointArea actor={actor}/>
                    <AbilitiesAreaEdit actor={actor}/>
                  </Fragment>,
              },
              {
                id: "settings",
                label: <i className="fa fa-cog" />,
                content: (
                  <SettingArea actor={actor} />
                ),
              },
            ]}
          />
        </div>
      </CSSReset>
    </ActorSheetAppContext.Provider>
  );
};
