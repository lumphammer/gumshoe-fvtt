import { memo, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { assertPCActor } from "../../module/actors/pc";
import {
  areBondsOn,
  getAdaptableTraumaTypesFrom,
} from "../../module/stability/settings";
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

/**
 * The PC sheet. Memoised (it has no props), so Foundry's own re-render stops
 * here: everything below reads the actor and settings through snapshots.
 * `PCSheet`, above, provides `SheetPermissionsContext`.
 */
export const PCSheetFull = memo(function PCSheetFull() {
  "use memo";

  const { actor } = useActorSheetContext();
  // kept here, not in the tab, so it lasts while you look at other tabs
  const [editMode, setEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("abilities");
  useSettingsButton(selectedTab, setSelectedTab, "settings");

  assertGame(game);
  assertPCActor(actor);

  const sheetTheme = useActorSnapshot(
    actor,
    (snapshot) => snapshot.system.sheetTheme,
  );
  const s = useSettings((s) => ({
    defaultThemeName: s.defaultThemeName,
    useMwStyleAbilities: s.useMwStyleAbilities,
    mwUseAlternativeItemTypes: s.mwUseAlternativeItemTypes,
    bondsOn: areBondsOn(s),
    hasAdaptableTraumaTypes: getAdaptableTraumaTypesFrom(s).length > 0,
    useNetworkContacts: s.useNetworkContacts,
    useCards: s.useCards,
  }));
  const theme = useTheme(sheetTheme || s.defaultThemeName);

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
                  ) : s.useMwStyleAbilities ? (
                    <AbilitiesAreaMW />
                  ) : (
                    <AbilitiesAreaPlay />
                  )}
                </>
              ),
            },
            // Moribund World's alternative item types have no weapons
            !s.mwUseAlternativeItemTypes && {
              id: "combat",
              label: "Combat",
              content: <WeaponsArea fillHeight />,
            },
            (s.bondsOn || s.hasAdaptableTraumaTypes) && {
              id: "bonds",
              // adaptations without Bonds
              label: s.bondsOn ? "Bonds" : "Adapted to",
              content: <BondsArea />,
            },
            s.useNetworkContacts && {
              id: "contacts",
              label: "Contacts",
              content: <NetworkContactsArea />,
            },
            s.useCards && {
              id: "cards",
              label: "Cards",
              content: <CardsArea />,
            },
            s.mwUseAlternativeItemTypes
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
});

PCSheetFull.displayName = "PCSheetFull";
