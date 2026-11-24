import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import {
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { css, cx } from "../styled-system/css";
import { tabs } from "../styled-system/recipes";
import { chooseTabColumns } from "./chooseTabColumns";
import { isActivationKey, keyboardFocus } from "./clickable";
import { getTranslated } from "../functions/getTranslated";
import { Translate } from "./Translate";

// gap between the tabs when they're in a grid
const wrappedGapEm = 0.25;

/**
 * The strip, its tabs and spacers, and the content: what `data-wrapped` goes
 * on, so a theme can style each by its own attribute (the `tabs` recipe).
 */
function wrappable(strip: HTMLElement) {
  const content = strip.parentElement?.querySelector(":scope > .tab-content");
  return [strip, ...strip.children, ...(content ? [content] : [])];
}

function setWrapped(strip: HTMLElement, wrapped: boolean) {
  for (const element of wrappable(strip)) {
    element.toggleAttribute("data-wrapped", wrapped);
  }
}

/**
 * When the tabs don't fit in one row, lay them out in a grid with as few rows
 * as will fit, by setting `data-wrapped` on the strip, its tabs and spacers
 * and the content, and `--tab-columns` on the strip. Done on the DOM rather
 * than through React state, so it happens before the first paint, and on
 * resizing without re-rendering. The tabs are measured unwrapped, so in their
 * unwrapped look.
 */
function fitTabStrip(strip: HTMLElement) {
  const available = strip.getBoundingClientRect().width;
  if (!available) {
    // not laid out (e.g. the sheet is minimised)
    return;
  }
  // measure each tab at its narrowest, in one row. Everything is measured on
  // screen, so with any transform (Foundry can scale windows), and the gap is
  // scaled to match
  setWrapped(strip, false);
  strip.setAttribute("data-measuring", "");
  const width = (element: Element) => element.getBoundingClientRect().width;
  const widths = Array.from(strip.querySelectorAll(":scope > label"), width);
  const rowSpacing = Array.from(
    strip.querySelectorAll(":scope > .tab-spacer"),
    width,
  ).reduce((sum, spacer) => sum + spacer, 0);
  const scale = width(strip) / strip.offsetWidth || 1;
  const gap =
    parseFloat(getComputedStyle(strip).fontSize) * wrappedGapEm * scale;
  strip.removeAttribute("data-measuring");

  const columns = chooseTabColumns(widths, rowSpacing, gap, available);
  if (columns !== null) {
    setWrapped(strip, true);
    strip.style.setProperty("--tab-columns", String(columns));
  }
}

type TabDefinition = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  translate?: boolean;
  /** not in the strip: only shown by setting `selected` */
  hidden?: boolean;
};

type TabContainerProps = {
  tabs: (TabDefinition | null | false | undefined)[];
  defaultTab: string;
  /** the selected tab, to control it from outside */
  selected?: string;
  onSelect?: (id: string) => void;
};

export const TabContainer = ({
  tabs: rawTabsDefs,
  defaultTab,
  selected: controlledSelected,
  onSelect,
}: TabContainerProps) => {
  const [uncontrolledSelected, setSelected] = useState(defaultTab);
  const selected = controlledSelected ?? uncontrolledSelected;
  const [optimistic, setOptimistic] = useState(defaultTab);
  const [pending, startTransition] = useTransition();
  const tabDefs = useMemo(() => rawTabsDefs.filter((t) => !!t), [rawTabsDefs]);
  const activeTabDef = useMemo(
    () => tabDefs.find((t) => t.id === selected),
    [selected, tabDefs],
  );
  const select = useCallback(
    (id: string) => {
      setOptimistic(id);
      startTransition(() => {
        setSelected(id);
        onSelect?.(id);
      });
    },
    [onSelect],
  );
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      select(e.currentTarget.value);
    },
    [select],
  );

  const stripTabDefs = tabDefs.filter((t) => !t.hidden);

  // the radio group's name, and the start of the tabs' and panel's ids
  const baseId = useId();
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;
  // the tab in the Tab order: the selected one, or the first while a tab
  // that isn't in the strip is showing
  const selectedInStrip = stripTabDefs.some((t) => t.id === selected);
  const tabStop = selectedInStrip ? selected : stripTabDefs[0]?.id;

  /**
   * The WAI-ARIA tabs pattern, with manual activation: the arrow keys, Home
   * and End move focus along the strip, and Enter or Space choose the
   * focused tab. Only the selected tab is in the Tab order. (The radios can't
   * be focused, so their labels take the keys.)
   */
  const onTabKeyDown = (event: KeyboardEvent<HTMLLabelElement>, id: string) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      if (id !== selected) {
        select(id);
      }
      return;
    }
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
        ":scope > [role=tab]",
      ) ?? [],
    );
    const index = tabs.indexOf(event.currentTarget);
    const next = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    tabs.at(next % tabs.length)?.focus();
  };

  // fit the strip when it's created, resized, a font loads, or the theme
  // changes (its fonts can change the tabs' widths but not the strip's, so
  // the ResizeObserver won't notice)
  const stripRef = useRef<HTMLDivElement | null>(null);
  const observeStrip = useCallback((strip: HTMLDivElement | null) => {
    stripRef.current = strip;
    if (!strip) {
      return;
    }
    fitTabStrip(strip);
    let lastWidth = strip.offsetWidth;
    const observer = new ResizeObserver(() => {
      // wrapping changes the height, so only refit if the width has changed
      if (strip.offsetWidth !== lastWidth) {
        lastWidth = strip.offsetWidth;
        fitTabStrip(strip);
      }
    });
    observer.observe(strip);
    const fonts = strip.ownerDocument.fonts;
    const refit = () => fitTabStrip(strip);
    fonts.addEventListener("loadingdone", refit);
    // a change of theme is a new slug and palette on the themed root
    const themed = strip.closest("[data-inv-theme]");
    const themeObserver = new MutationObserver(refit);
    if (themed) {
      themeObserver.observe(themed, {
        attributes: true,
        attributeFilter: ["data-inv-theme", "style"],
      });
    }
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      fonts.removeEventListener("loadingdone", refit);
    };
  }, []);

  // and when the tabs or their labels change (Bonds and Adapted to share an
  // id): that can change the tabs' widths but not the strip's, so the
  // ResizeObserver won't notice. And when the selected tab changes, as the
  // content is replaced (see its `key`), and needs `data-wrapped` again
  const fitKey = stripTabDefs
    .map(({ id, label }) => `${id}:${typeof label === "string" ? label : ""}`)
    .join("\n");
  useLayoutEffect(() => {
    if (stripRef.current) {
      fitTabStrip(stripRef.current);
    }
  }, [fitKey, selected]);

  const classes = tabs();

  return (
    <div
      className={cx(
        "tab-container-outer",
        css({
          position: "absolute",
          inset: "0",
          display: "flex",
          flexDirection: "column",
          // the hidden radios: the labels after them are the tabs
          "& input[type=radio]": { display: "none" },
        }),
      )}
    >
      <div
        className={cx(
          "tab-strip",
          classes.list,
          css({
            display: "flex",
            flexDirection: "row",
            "&[data-measuring]": { width: "min-content" },
            "&[data-wrapped]": {
              display: "grid",
              gridTemplateColumns: "repeat(var(--tab-columns), 1fr)",
              gap: `${wrappedGapEm}em`,
              marginBottom: "0.4em",
            },
          }),
        )}
        ref={observeStrip}
        role="tablist"
      >
        {stripTabDefs.map(({ id, label, translate = true }, index) => {
          const radioId = `${baseId}-radio-${id}`;
          return (
            <Fragment key={id}>
              <input
                name={baseId}
                id={radioId}
                type="radio"
                value={id}
                checked={id === selected}
                onChange={onChange}
              />
              <label
                htmlFor={radioId}
                id={tabId(id)}
                role="tab"
                aria-selected={id === selected}
                aria-controls={id === selected ? panelId : undefined}
                tabIndex={id === tabStop ? 0 : -1}
                {...keyboardFocus}
                onKeyDown={(event) => onTabKeyDown(event, id)}
                data-interactive={id === selected ? undefined : true}
                // the selected tab's state, for its look (the tabs recipe)
                data-selected={id === selected ? true : undefined}
                className={cx(
                  classes.tab,
                  css({
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }),
                )}
                style={{
                  opacity: pending && id === optimistic ? 0.5 : undefined,
                }}
              >
                {typeof label === "string" ? (
                  translate ? (
                    <Translate>{label}</Translate>
                  ) : (
                    label
                  )
                ) : (
                  label
                )}
              </label>
              {index < stripTabDefs.length - 1 && (
                <div className={cx("tab-spacer", classes.spacer)} />
              )}
            </Fragment>
          );
        })}
      </div>
      <div
        // a new panel for each tab, so each starts scrolled to the top
        key={selected}
        id={panelId}
        role="tabpanel"
        // out of the Tab order: Firefox puts a box that scrolls in it, but
        // the panel's contents are reached by tabbing anyway
        tabIndex={-1}
        // a tab not in the strip (e.g. Settings) has no tab to name it
        aria-labelledby={selectedInStrip ? tabId(selected) : undefined}
        aria-label={
          !selectedInStrip && typeof activeTabDef?.label === "string"
            ? activeTabDef.translate === false
              ? activeTabDef.label
              : getTranslated(activeTabDef.label)
            : undefined
        }
        className={cx(
          "tab-content",
          classes.content,
          css({ flex: "1", position: "relative", overflow: "auto" }),
        )}
      >
        {activeTabDef?.content}
      </div>
    </div>
  );
};
