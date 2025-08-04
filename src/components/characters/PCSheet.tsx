import { ReactNode, useCallback, useEffect, useState } from "react";

import { occupationSlotIndex } from "../../constants";
import { assertGame } from "../../functions/isGame";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { assertPCActor } from "../../module/actors/pc";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { PersonalDetailItem } from "../../module/items/personalDetail";
import { settings } from "../../settings/settings";
import { CardsArea } from "../cards/CardsArea";
import { CSSReset } from "../CSSReset";
import { ImagePickle } from "../ImagePickle";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { IndexedAsyncTextInput } from "../inputs/IndexedAsyncTextInput";
import { InputGrid } from "../inputs/InputGrid";
import { TabContainer } from "../TabContainer";
import { Translate } from "../Translate";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { CharacterCombatAbilityPicker } from "./CharacterCombatAbilityPicker";
import { EquipmentArea } from "./Equipment/EquipmentArea";
import { LogoEditable } from "./LogoEditable";
import { AbilitiesAreaMW } from "./MoribundWorld/AbilitiesAreaMW";
import { MwInjuryStatusWidget } from "./MoribundWorld/MwInjuryStatusWidget";
import { MwItemArea } from "./MoribundWorld/MwItemArea";
import { NotesArea } from "./NotesArea";
import { PersonalDetailField } from "./PersonalDetailField";
import { SettingArea } from "./SettingsArea";
import { StatField } from "./StatField";
import { TrackersArea } from "./TrackersArea";
import { WeaponsArea } from "./Weapons/WeaponsArea";

const settingsUseMwStyleAbilities = settings.useMwStyleAbilities.get;
const settingsUseMwInjuryStatus = settings.useMwInjuryStatus.get;
const settingsUseCards = settings.useCards.get;

export const PCSheet = () => {
  const { actor } = useActorSheetContext();

  assertGame(game);
  assertPCActor(actor);

  const updateShortNote = useCallback(
    async (value: string, index: number) => {
      await actor.system.setShortNote(index, value);
    },
    [actor],
  );

  const updateMwHiddenShortNote = useCallback(
    async (value: string, index: number) => {
      await actor.system.setMwHiddenShortNote(index, value);
    },
    [actor],
  );

  const genericOccupation = settings.genericOccupation.get();

  const [occupation, setOccupation] = useState<PersonalDetailItem | undefined>(
    actor.system.getOccupations()[0],
  );

  // some acrobatics here to make sure we update the occupation when it changes
  // there's no built in hook for "an actor's items changed"
  useEffect(() => {
    const callback = (affectedItem: InvestigatorItem) => {
      if (affectedItem.isOwned && affectedItem.actor?.id === actor.id) {
        setOccupation(actor.system.getOccupations()[0]);
      }
    };
    Hooks.on("createItem", callback);
    Hooks.on("updateItem", callback);
    Hooks.on("deleteItem", callback);
    return () => {
      Hooks.off("createItem", callback);
      Hooks.off("updateItem", callback);
      Hooks.off("deleteItem", callback);
    };
  }, [actor]);

  const themeName = actor.system.getSheetThemeName();
  const theme = useTheme(themeName);
  const personalDetails = settings.personalDetails.get();
  const shortHiddenNotesNames = settings.mwHiddenShortNotes.get();
  const occupationLabel = settings.occupationLabel.get();
  const stats = settings.pcStats.get();

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
        gridTemplateRows: "min-content max-content 1fr",
        gridTemplateColumns: "10em 1fr 10em",
        gap: "0.5em",
        gridTemplateAreas:
          '"title title image" ' +
          '"pools stats image" ' +
          '"pools body  body" ',
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
          subText={occupation?.name ?? genericOccupation}
          onChangeMainText={actor.setName}
          onChangeSubText={occupation?.setName}
        />
      </div>
      <div
        css={{
          gridArea: "title",
          textAlign: "center",
          position: "relative",
        }}
      >
        <LogoEditable
          mainText={actor.name ?? ""}
          subText={occupation?.name ?? genericOccupation}
          defaultSubText={settings.genericOccupation.get()}
          onChangeMainText={actor.setName}
          onChangeSubText={occupation?.setName}
        />
      </div>
      <ImagePickle
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
          <GridField label="Person Name">
            <AsyncTextInput value={actor.name ?? ""} onChange={actor.setName} />
          </GridField>
          <PersonalDetailField
            name={occupationLabel}
            actor={actor}
            slotIndex={occupationSlotIndex}
          />
          {personalDetails.map(({ name, type }, i) =>
            type === "text" ? (
              <GridField noTranslate key={`${name}--${i}`} label={name}>
                <IndexedAsyncTextInput
                  value={actor.system.shortNotes[i]}
                  onChange={updateShortNote}
                  index={i}
                />
              </GridField>
            ) : (
              <PersonalDetailField
                key={`${name}--${i}`}
                name={name}
                actor={actor}
                slotIndex={i}
              />
            ),
          )}
          {game.user.isGM &&
            shortHiddenNotesNames.map((name: string, i: number) => (
              <GridField noTranslate key={`${name}--${i}`} label={name}>
                <IndexedAsyncTextInput
                  value={actor.system.hiddenShortNotes[i]}
                  onChange={updateMwHiddenShortNote}
                  index={i}
                />
              </GridField>
            ))}
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
          display: "flex",
          flexDirection: "column",
          gap: "0.5em",
          ...theme.panelStylePrimary,
        }}
      >
        {settingsUseMwStyleAbilities() && (
          <>
            <Button onClick={actor.system.confirmMw2Refresh}>
              <Translate>2h Refresh</Translate>
            </Button>
            <Button onClick={actor.system.confirmMw4Refresh}>
              <Translate>4h Refresh</Translate>
            </Button>
            <Button onClick={actor.system.confirmMw8Refresh}>
              <Translate>8h Refresh</Translate>
            </Button>
          </>
        )}
        <Button onClick={actor.system.confirmRefresh}>
          <Translate>Full Refresh</Translate>
        </Button>
        {settingsUseMwStyleAbilities() || (
          <>
            <Button onClick={actor.system.confirm24hRefresh}>
              <Translate>24h Refresh</Translate>
            </Button>
          </>
        )}
        {settingsUseMwInjuryStatus() && (
          <>
            <MwInjuryStatusWidget
              status={actor.system.mwInjuryStatus}
              setStatus={actor.system.setMwInjuryStatus}
            />
          </>
        )}
        <TrackersArea />
        {Object.keys(stats).map<ReactNode>((key) => {
          return <StatField key={key} id={key} stat={stats[key]} />;
        })}
        <CharacterCombatAbilityPicker />
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
              content: settingsUseMwStyleAbilities() ? (
                <AbilitiesAreaMW />
              ) : (
                <AbilitiesAreaPlay />
              ),
            },
            settingsUseCards() && {
              id: "cards",
              label: "Cards",
              content: <CardsArea />,
            },
            settings.mwUseAlternativeItemTypes.get()
              ? {
                  id: "items",
                  label: "MWItems",
                  content: <MwItemArea />,
                }
              : {
                  id: "equipment",
                  label: "Equipment",
                  content: (
                    <>
                      <WeaponsArea />
                      <div css={{ height: "1em" }} />
                      <EquipmentArea />
                    </>
                  ),
                },
            {
              id: "notes",
              label: "Notes",
              content: <NotesArea />,
            },
            {
              id: "abilities-edit",
              label: "Edit",
              content: <AbilitiesAreaEdit />,
            },
            {
              id: "settings",
              label: <i className="fa fa-cog" />,
              content: <SettingArea />,
            },
          ]}
        />
      </div>
    </CSSReset>
  );
};

PCSheet.displayName = "PCSheet";
