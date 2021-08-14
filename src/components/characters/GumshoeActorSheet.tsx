/** @jsx jsx */
import { Fragment, useCallback } from "react";
import { GumshoeActor } from "../../module/GumshoeActor";
import { jsx } from "@emotion/react";
import { useUpdate } from "../../hooks/useUpdate";
import { AbilitiesArea } from "./AbilitiesArea";
import { CSSReset } from "../CSSReset";
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
import { getOccupationlabel, getShortNotes } from "../../settingsHelpers";
import { Translate } from "../Translate";
import { assertPCDataSource, isPCDataSource } from "../../types";

type GumshoeActorSheetProps = {
  actor: GumshoeActor,
  foundryApplication: ActorSheet,
}

export const GumshoeActorSheet = ({
  actor,
  foundryApplication,
}: GumshoeActorSheetProps) => {
  assertPCDataSource(actor.data);
  const onImageClick = useCallback(() => {
    console.log("onImageClick");
    const fp = new FilePicker({
      type: "image",
      current: actor.data.img,
      callback: (path: string) => {
        actor.update({
          img: path,
        });
      },
      top: (foundryApplication.position.top ?? 0) + 40,
      left: (foundryApplication.position.left ?? 0) + 10,
    });
    // types aren't quite right for fp
    return (fp as any).browse();
  }, [actor, foundryApplication.position.left, foundryApplication.position.top]);

  const updateName = useUpdate(actor, name => ({ name }));
  const updateOccupation = useUpdate(actor, occupation => ({ data: { occupation } }));

  const updateShortNote = useCallback((value, index) => {
    actor.setShortNote(index, value);
  }, [actor]);

  const theme = actor.getSheetTheme();

  const shortNotesNames = getShortNotes();

  const occupationLabel = getOccupationlabel();

  return (
    <ActorSheetAppContext.Provider value={foundryApplication}>
      <CSSReset
        theme={theme}
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
            text={actor.data.name}
            subtext={actor.data.data.occupation}
            defaultSubtext="Investigator"
            onChangeText={updateName}
            onChangeSubtext={updateOccupation}
          />
        </div>
        <div
          css={{
            gridArea: "image",
            backgroundImage: `url("${actor.data.img}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "0.2em",
            boxShadow: "0em 0em 0.5em 0.1em rgba(0,0,0,0.5)",
            transform: "rotateZ(2deg)",
          }}
          onClick={onImageClick}
        />

        <div
          css={{
            gridArea: "stats",
            padding: "1em",
            backgroundColor: theme.colors.bgTransSecondary,
            position: "relative",
          }}
        >
          <InputGrid>
          <GridField label="Name">
              <AsyncTextInput
                value={actor.data.name}
                onChange={updateName}
              />
            </GridField>
            <GridField noTranslate label={occupationLabel}>
              <AsyncTextInput
                value={actor.data.data.occupation}
                onChange={updateOccupation}
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
          </InputGrid>
        </div>

        <div
          css={{
            gridArea: "pools",
            position: "relative",
            overflowX: "visible",
            overflowY: "auto",
            padding: "1em",
            background: theme.colors.bgTransPrimary,
          }}
          >
            <button onClick={actor.confirmRefresh}>
              <Translate>Refresh</Translate>
            </button>
            <hr/>
            <TrackersArea actor={actor} />
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
                content: <AbilitiesArea actor={actor}/>,
              },
              {
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
