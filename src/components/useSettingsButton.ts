import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext, useEffect, useRef } from "react";

type ApplicationV2 = foundry.applications.api.ApplicationV2;

/**
 * The action of the settings button in a sheet's header (the PC sheet's, an
 * item sheet's), which `useSettingsButton` shows and handles.
 */
export const settingsButtonAction = "toggleSheetSettings";

/** The settings button, for a sheet class's `_getFrameButtons`. */
export const settingsFrameButton = {
  icon: "fa-solid fa-gear",
  label: "investigator.Settings",
  action: settingsButtonAction,
};

/**
 * Hide the settings button in a frame from a sheet class's `_renderFrame`:
 * the sheet shows it while `useSettingsButton` is mounted.
 */
export const hideSettingsButton = (frame: HTMLElement) => {
  frame
    .querySelector<HTMLElement>(`[data-action="${settingsButtonAction}"]`)
    ?.style.setProperty("display", "none");
};

const getButton = (app: ApplicationV2 | null) =>
  app?.element?.querySelector<HTMLButtonElement>(
    `.window-header [data-action="${settingsButtonAction}"]`,
  );

/**
 * Show the settings button in the sheet's header while this is mounted and
 * `enabled` (it's hidden from Limited users), calling `onToggle` when it's
 * clicked. It's pressed while `pressed`.
 */
export const useSettingsButton = ({
  pressed,
  onToggle,
  enabled = true,
}: {
  pressed: boolean;
  onToggle: () => void;
  enabled?: boolean;
}) => {
  const app = useContext(FoundryAppContext);

  // the latest handler, for the click listener, which is only attached once.
  // No dependencies on purpose: this runs after every render, so the ref is
  // always up to date. It's an effect rather than written during render so a
  // render React throws away (StrictMode, transitions) can't leave it in the
  // ref
  const toggle = useRef(onToggle);
  useEffect(() => {
    toggle.current = onToggle;
  });

  useEffect(() => {
    const button = getButton(app);
    if (!button || !enabled) {
      return;
    }
    button.style.removeProperty("display");
    const onClick = () => toggle.current();
    button.addEventListener("click", onClick);
    return () => {
      button.removeEventListener("click", onClick);
      button.style.setProperty("display", "none");
    };
  }, [app, enabled]);

  useEffect(() => {
    const button = getButton(app);
    if (!button) {
      return;
    }
    button.setAttribute("aria-pressed", String(pressed));
    if (pressed) {
      button.style.setProperty(
        "--button-background-color",
        "rgba(255, 255, 255, 0.2)",
      );
    } else {
      button.style.removeProperty("--button-background-color");
    }
  }, [app, pressed]);
};

/**
 * The settings button toggling a sheet's settings tab, going back to the tab
 * that was showing before.
 */
export const useSettingsTabButton = (
  selectedTab: string,
  setSelectedTab: (id: string) => void,
  settingsTab: string,
) => {
  const showingSettings = selectedTab === settingsTab;
  // the tab to go back to: kept in an effect, for the same reason as above
  const previousTab = useRef("");
  useEffect(() => {
    if (!showingSettings) {
      previousTab.current = selectedTab;
    }
  });
  useSettingsButton({
    pressed: showingSettings,
    onToggle: () => {
      setSelectedTab(showingSettings ? previousTab.current : settingsTab);
    },
  });
};
