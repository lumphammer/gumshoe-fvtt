import { useState } from "react";

import { assertGame } from "../../functions/isGame";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { assertPCActor } from "../../module/actors/pc";
import {
  areBondsOn,
  getAdaptableTraumaTypes,
} from "../../module/stability/settings";
import { settings } from "../../settings/settings";
import { CardsArea } from "../cards/CardsArea";
import { CSSReset } from "../CSSReset";
import { BondsArea } from "../bonds/BondsArea";
import { NetworkContactsArea } from "../contacts/NetworkContactsArea";
import { TabContainer } from "../TabContainer";
import { AbilitiesAreaEdit } from "./AbilitiesAreaEdit";
import { AbilitiesAreaPlay } from "./AbilitiesAreaPlay";
import { EditModeToggle } from "./EditModeToggle";
import { EquipmentArea } from "./Equipment/EquipmentArea";
import { AbilitiesAreaMW } from "./MoribundWorld/AbilitiesAreaMW";
import { MwItemArea } from "./MoribundWorld/MwItemArea";
import { NotesArea } from "./NotesArea";
import { PCSheetHeader, PCSheetPools, PCSheetStats } from "./PCSheetPanels";
import { SettingArea } from "./SettingsArea";
import { useSettingsButton } from "./useSettingsButton";
import { WeaponsArea } from "./Weapons/WeaponsArea";

const settingsUseMwStyleAbilities = settings.useMwStyleAbilities.get;
const settingsUseCards = settings.useCards.get;

export const PCSheetFull = () => {
  const { actor } = useActorSheetContext();
  // kept here, not in the tab, so it lasts while you look at other tabs
  const [editMode, setEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("abilities");
  useSettingsButton(selectedTab, setSelectedTab, "settings");

  assertGame(game);
  assertPCActor(actor);

  const themeName = actor.system.getSheetThemeName();
  const theme = useTheme(themeName);

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
      <PCSheetHeader />
      <PCSheetStats />
      <PCSheetPools />

      <div
        css={{
          gridArea: "body",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <TabContainer
          defaultTab="abilities"
          selected={selectedTab}
          onSelect={setSelectedTab}
          tabs={[
            {
              id: "abilities",
              label: "Abilities",
              content: (
                <>
                  <EditModeToggle
                    editMode={editMode}
                    setEditMode={setEditMode}
                  />
                  {editMode ? (
                    <AbilitiesAreaEdit />
                  ) : settingsUseMwStyleAbilities() ? (
                    <AbilitiesAreaMW />
                  ) : (
                    <AbilitiesAreaPlay />
                  )}
                </>
              ),
            },
            // Moribund World's alternative item types have no weapons
            !settings.mwUseAlternativeItemTypes.get() && {
              id: "combat",
              label: "Combat",
              content: <WeaponsArea fillHeight />,
            },
            (areBondsOn() || getAdaptableTraumaTypes().length > 0) && {
              id: "bonds",
              // adaptations without Bonds
              label: areBondsOn() ? "Bonds" : "Adapted to",
              content: <BondsArea />,
            },
            settings.useNetworkContacts.get() && {
              id: "contacts",
              label: "Contacts",
              content: <NetworkContactsArea />,
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
                  content: <EquipmentArea />,
                },
            {
              id: "notes",
              label: "Notes",
              content: <NotesArea />,
            },
            {
              id: "settings",
              label: "Settings",
              content: <SettingArea />,
              hidden: true,
            },
          ]}
        />
      </div>
    </CSSReset>
  );
};

PCSheetFull.displayName = "PCSheetFull";
