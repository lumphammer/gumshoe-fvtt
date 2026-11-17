import { type CSSProperties, useState } from "react";

import { SheetPermissionsContext } from "../../hooks/useIsEditable";
import { useRuntimeRegistries } from "../../hooks/useRuntimeRegistries";
import { css } from "../../styled-system/css";
import { ThemeSpecimen } from "./ThemeSpecimen";

const storageKey = "investigator-theme-farm";

type Settings = {
  /** the themes shown, by id; null for all of them */
  shown: string[] | null;
  logoText: string;
  /** each column's width, in px */
  width: number;
};

const defaults: Settings = {
  shown: null,
  logoText: "Alberta Moss",
  width: 420,
};

// remembered in this browser, so the farm opens the way it was left
function load(): Settings {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

function save(settings: Settings) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // not remembered, then
  }
}

// everything editable, as though it were a sheet the user owns
const permissions = { isEditable: true, isLimited: false };

const chip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "[0.3em]",
  padding: "[0.1em 0.5em]",
  borderRadius: "[1em]",
  border: "[1px solid #555]",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  "&:has(input:checked)": { background: "[#345]", borderColor: "[#8ab]" },
  "& input": { margin: "0" },
});

const toolbarButton = css({
  width: "auto",
  flex: "none",
  padding: "[0.1em 0.6em]",
  lineHeight: "[1.4]",
  background: "[#333]",
  color: "[#fff]",
  border: "[1px solid #555]",
});

/**
 * Every theme side by side, with the catalogue's components in each, for
 * working on themes. `showThemeFarm()` in the console opens it.
 */
export const ThemeFarm = () => {
  const [settings, setSettingsState] = useState(load);
  const setSettings = (change: Partial<Settings>) =>
    setSettingsState((old) => {
      const next = { ...old, ...change };
      save(next);
      return next;
    });

  // live, so themes installed or changed while it's open show up
  const { themes } = useRuntimeRegistries();
  const ids = Object.keys(themes);
  const shown = settings.shown ?? ids;
  const toggleTheme = (id: string) =>
    setSettings({
      shown: shown.includes(id)
        ? shown.filter((other) => other !== id)
        : ids.filter((other) => other === id || shown.includes(other)),
    });

  return (
    <SheetPermissionsContext.Provider value={permissions}>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          backgroundColor: "[#111]",
          color: "[#ddd]",
          font: "[13px sans-serif]",
          position: "absolute",
          inset: "0",
        })}
      >
        <div
          className={css({
            flex: "none",
            display: "flex",
            flexDirection: "column",
            gap: "[0.5em]",
            padding: "[0.5em]",
            borderBottom: "[1px solid #333]",
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "[1em]",
              flexWrap: "wrap",
            })}
          >
            <label
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "[0.4em]",
              })}
            >
              Name
              <input
                type="text"
                value={settings.logoText}
                onChange={(e) => setSettings({ logoText: e.target.value })}
                className={css({
                  width: "[20em]",
                  background: "[#222]",
                  color: "[#fff]",
                })}
              />
            </label>
            <label
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "[0.4em]",
              })}
            >
              Width
              <input
                type="range"
                min={240}
                max={1000}
                step={10}
                value={settings.width}
                onChange={(e) => setSettings({ width: Number(e.target.value) })}
              />
              {settings.width}px
            </label>
            <button
              type="button"
              className={toolbarButton}
              onClick={() => setSettings({ shown: null })}
            >
              All
            </button>
            <button
              type="button"
              className={toolbarButton}
              onClick={() => setSettings({ shown: [] })}
            >
              None
            </button>
          </div>
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              gap: "[0.3em]",
            })}
          >
            {ids.map((id) => (
              <label key={id} className={chip} title={id}>
                <input
                  type="checkbox"
                  checked={shown.includes(id)}
                  onChange={() => toggleTheme(id)}
                />
                {themes[id].displayName}
              </label>
            ))}
          </div>
        </div>
        <div
          className={css({
            flex: "1",
            minHeight: "0",
            overflow: "auto",
          })}
          style={
            { "--farm-column-width": `${settings.width}px` } as CSSProperties
          }
        >
          {/* the columns, wrapping, so the farm scrolls down; each as tall as
            the tallest in its row */}
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              alignItems: "stretch",
              gap: "[2px]",
            })}
          >
            {ids
              .filter((id) => shown.includes(id))
              .map((id) => (
                <ThemeSpecimen
                  key={id}
                  id={id}
                  theme={themes[id]}
                  logoText={settings.logoText}
                  onChangeLogoText={(logoText) => setSettings({ logoText })}
                />
              ))}
          </div>
        </div>
      </div>
    </SheetPermissionsContext.Provider>
  );
};
