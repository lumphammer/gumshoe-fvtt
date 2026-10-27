import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext, useEffect, useRef } from "react";

type ApplicationV2 = foundry.applications.api.ApplicationV2;

/** The action of the settings button in the PC sheet's header */
export const settingsButtonAction = "toggleSheetSettings";

const getButton = (app: ApplicationV2 | null) =>
  app?.element?.querySelector<HTMLButtonElement>(
    `.window-header [data-action="${settingsButtonAction}"]`,
  );

/**
 * Show the settings button in the sheet's header while this is mounted (it's
 * hidden in the limited view), and make it toggle the settings tab, going back
 * to the tab that was showing before. It's pressed while settings are showing.
 */
export const useSettingsButton = (
  selectedTab: string,
  setSelectedTab: (id: string) => void,
  settingsTab: string,
) => {
  const app = useContext(FoundryAppContext);
  const showingSettings = selectedTab === settingsTab;

  // the latest of these, for the click handler, which is only attached once.
  // No dependencies on purpose: this runs after every render, so the ref is
  // always up to date. It's an effect rather than written during render so a
  // render React throws away (StrictMode, transitions) can't leave its values
  // in the ref
  const state = useRef({ selectedTab, setSelectedTab, previousTab: "" });
  useEffect(() => {
    state.current.selectedTab = selectedTab;
    state.current.setSelectedTab = setSelectedTab;
    if (!showingSettings) {
      state.current.previousTab = selectedTab;
    }
  });

  useEffect(() => {
    const button = getButton(app);
    if (!button) {
      return;
    }
    button.style.removeProperty("display");
    const onClick = () => {
      const { selectedTab, setSelectedTab, previousTab } = state.current;
      setSelectedTab(selectedTab === settingsTab ? previousTab : settingsTab);
    };
    button.addEventListener("click", onClick);
    return () => {
      button.removeEventListener("click", onClick);
      button.style.setProperty("display", "none");
    };
  }, [app, settingsTab]);

  useEffect(() => {
    const button = getButton(app);
    if (!button) {
      return;
    }
    button.setAttribute("aria-pressed", String(showingSettings));
    if (showingSettings) {
      button.style.setProperty(
        "--button-background-color",
        "rgba(255, 255, 255, 0.2)",
      );
    } else {
      button.style.removeProperty("--button-background-color");
    }
  }, [app, showingSettings]);
};
