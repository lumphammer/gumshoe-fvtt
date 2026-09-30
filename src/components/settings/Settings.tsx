import { Router } from "@lumphammer/minirouter";
import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useCallback, useContext, useEffect } from "react";
import {
  FaEllipsis,
  FaLayerGroup,
  FaLightbulb,
  FaSliders,
  FaUserGroup,
  FaToolbox,
} from "react-icons/fa6";
import { LuSwords } from "react-icons/lu";

import { settingsCloseAttempted, settingsSaved } from "../../constants";
import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { assertGame } from "../../functions/isGame";
import { useTheme } from "../../hooks/useTheme";
import {
  getSettingsSaveErrorMessage,
  saveSettings,
  SettingsSaveError,
} from "../../settings/saveSettings";
import { settings } from "../../settings/settings";
import { absoluteCover } from "../absoluteCover";
import { CSSReset } from "../CSSReset";
import { Button } from "../inputs/Button";
import { ShowBackLinkContext } from "../nestedPanels/ShowBackLinkContext";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { Translate } from "../Translate";
import { abilityPages } from "./Abilities/abilityPages";
import { AbilitySettingsRoutes } from "./Abilities/AbilitySettingsRoutes";
import { actorPages } from "./Actors/actorPages";
import { ActorSettingsRoutes } from "./Actors/ActorSettingsRoutes";
import { CardsSettings } from "./Cards/CardsSettings";
import { CardsSettingsRoutes } from "./Cards/CardsSettingsRoutes";
import { combatPages } from "./Combat/combatPages";
import { CombatSettingsRoutes } from "./Combat/CombatSettingsRoutes";
import {
  DirtyContext,
  DispatchContext,
  ModifyContext,
  StateContext,
} from "./contexts";
import { CoreSettings } from "./CoreSettings";
import {
  abilitySettings,
  actorSettings,
  cardsSettings,
  combatSettings,
  coreSettings,
  equipmentSettings,
  miscSettings,
} from "./directions";
import { EquipmentSettings } from "./Equipment/EquipmentSettings";
import { EquipmentSettingsRoutes } from "./Equipment/EquipmentSettingsRoutes";
import { useSettingsState } from "./hooks";
import { getVisibleMiscPages, miscPages } from "./Misc/miscPages";
import { MiscSettingsRoutes } from "./Misc/MiscSettingsRoutes";
import { SettingsBreadcrumbs } from "./SettingsBreadcrumbs";
import { SettingsMenu } from "./SettingsMenu";
import { SettingsMenuLink } from "./SettingsMenuLink";

export const Settings = () => {
  assertGame(game);
  const foundryApplication = useContext(FoundryAppContext);
  if (foundryApplication === null) {
    throw new Error("Settings must be used within a FoundryAppContext");
  }
  const { tempState, setters, tempStateRef, dispatch, isDirty, modify } =
    useSettingsState();
  const theme = useTheme(tempState.settings.defaultThemeName);

  const handleClose = useCallback(async () => {
    let aye = !isDirty();
    if (!aye) {
      aye = await confirmADoodleDo({
        message: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Yes, discard my changes",
        cancelText: "Whoops, No!",
        confirmIconClass: "fas fa-times",
        resolveFalseOnCancel: true,
      });
    }
    if (aye) {
      await foundryApplication.close({ submitted: true });
    }
  }, [foundryApplication, isDirty]);

  const handleClickClose = useCallback(() => {
    return handleClose();
  }, [handleClose]);

  const handleClickSave = useCallback(async () => {
    try {
      await saveSettings(tempStateRef.current.settings, settings);
      Hooks.call(settingsSaved);
      await foundryApplication.close({ submitted: true });
    } catch (error) {
      const message =
        error instanceof SettingsSaveError
          ? getSettingsSaveErrorMessage(error)
          : `Could not save settings: ${String(error)}`;
      ui.notifications?.error(message, { permanent: true });
    }
  }, [foundryApplication, tempStateRef]);

  const pages = [
    {
      direction: coreSettings,
      label: "Core",
      icon: <FaSliders />,
      content: <CoreSettings setters={setters} />,
    },
    {
      direction: actorSettings,
      label: "Actors",
      icon: <FaUserGroup />,
      content: <SettingsMenu pages={actorPages} />,
      subPages: actorPages,
      childRoutes: <ActorSettingsRoutes setters={setters} />,
    },
    {
      direction: abilitySettings,
      label: "Abilities",
      icon: <FaLightbulb />,
      content: <SettingsMenu pages={abilityPages} />,
      subPages: abilityPages,
      childRoutes: <AbilitySettingsRoutes setters={setters} />,
    },
    {
      direction: combatSettings,
      label: "Combat",
      icon: <LuSwords />,
      content: <SettingsMenu pages={combatPages} />,
      subPages: combatPages,
      childRoutes: <CombatSettingsRoutes setters={setters} />,
    },
    {
      direction: equipmentSettings,
      label: "Equipment categories",
      icon: <FaToolbox />,
      content: <EquipmentSettings />,
      childRoutes: <EquipmentSettingsRoutes />,
    },
    {
      direction: cardsSettings,
      label: "Cards",
      icon: <FaLayerGroup />,
      content: <CardsSettings setters={setters} />,
      childRoutes: <CardsSettingsRoutes />,
    },
    {
      direction: miscSettings,
      label: "Miscellaneous",
      icon: <FaEllipsis />,
      content: <SettingsMenu pages={getVisibleMiscPages()} />,
      subPages: miscPages,
      childRoutes: <MiscSettingsRoutes setters={setters} />,
    },
  ];

  // if anything attempts to close the window without our approval, we block it
  // in the SettingsClass and fire this event for us to handle here
  useEffect(() => {
    const id = Hooks.on(settingsCloseAttempted, handleClose);
    return () => {
      Hooks.off(settingsCloseAttempted, id);
    };
  }, [handleClose]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <ModifyContext.Provider value={modify}>
        <StateContext.Provider value={tempState}>
          <DirtyContext.Provider value={isDirty}>
            <CSSReset
              mode="small"
              theme={theme}
              css={{
                ...absoluteCover,
                display: "flex",
                flexDirection: "column",
                padding: "0.5em",
              }}
            >
              <ShowBackLinkContext.Provider value={false}>
                <Router>
                  <SettingsBreadcrumbs pages={pages} />
                  <div
                    css={{ flex: 1, overflow: "hidden", position: "relative" }}
                  >
                    <nav
                      data-testid="settings-menu"
                      css={{
                        ...absoluteCover,
                        overflow: "auto",
                        ...theme.panelStylePrimary,
                      }}
                    >
                      {pages.map(({ direction, label, icon }) => (
                        <SettingsMenuLink
                          key={label}
                          to={direction()}
                          label={label}
                          icon={icon}
                        />
                      ))}
                    </nav>
                    {pages.map(({ direction, label, content, childRoutes }) => (
                      <SlideInNestedPanelRoute
                        key={label}
                        direction={direction}
                        margin="0em"
                        childRoutes={childRoutes}
                      >
                        {/* some pages cover their parent, so give them one */}
                        <div css={{ height: "100%", position: "relative" }}>
                          {content}
                        </div>
                      </SlideInNestedPanelRoute>
                    ))}
                  </div>
                </Router>
              </ShowBackLinkContext.Provider>
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  padding: "0.5em",
                  background: theme.colors.backgroundSecondary,
                }}
              >
                <Button
                  css={{ flex: 1, paddingTop: "0.5em", paddingBottom: "0.5em" }}
                  onClick={handleClickClose}
                >
                  <i className="fas fa-times" /> <Translate>Cancel</Translate>
                </Button>
                <Button
                  css={{ flex: 1, paddingTop: "0.5em", paddingBottom: "0.5em" }}
                  onClick={handleClickSave}
                >
                  <i className="fas fa-save" />{" "}
                  <Translate>Save Changes</Translate>
                </Button>
              </div>
            </CSSReset>
          </DirtyContext.Provider>
        </StateContext.Provider>
      </ModifyContext.Provider>
    </DispatchContext.Provider>
  );
};

Settings.displayName = "Settings";
