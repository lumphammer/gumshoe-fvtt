import { nanoid } from "nanoid";
import type { ChangeEvent, ReactNode } from "react";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { css, cx } from "../styled-system/css";
import { tabs } from "../styled-system/recipes";
import { chooseTabColumns } from "./chooseTabColumns";
import { Translate } from "./Translate";
import { OnSurface } from "./Panel";

// gap between the tabs when they're in a grid
const wrappedGapEm = 0.25;

/**
 * When the tabs don't fit in one row, lay them out in a grid with as few rows
 * as will fit, by setting `data-wrapped` and `--tab-columns` on the strip.
 * Done on the DOM rather than through React state, so it happens before the
 * first paint, and on resizing without re-rendering.
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
  strip.removeAttribute("data-wrapped");
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
    strip.setAttribute("data-wrapped", "");
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
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const id = e.currentTarget.value;
      setOptimistic(id);
      startTransition(() => {
        setSelected(id);
        onSelect?.(id);
      });
    },
    [onSelect],
  );

  const stripTabDefs = tabDefs.filter((t) => !t.hidden);

  // would love to do this point-free, but react compiler wants to see a
  // function literal
  const radioGroup = useMemo(() => nanoid(), []);

  // fit the strip when it's created, resized, a font loads, or the theme
  // changes (its fonts can change the tabs' widths but not the strip's, so
  // the ResizeObserver won't notice). It's replaced when the selected tab
  // changes (see the `key` below)
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
  // ResizeObserver won't notice
  const fitKey = stripTabDefs
    .map(({ id, label }) => `${id}:${typeof label === "string" ? label : ""}`)
    .join("\n");
  useLayoutEffect(() => {
    if (stripRef.current) {
      fitTabStrip(stripRef.current);
    }
  }, [fitKey]);

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
      key={selected}
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
      >
        {stripTabDefs.map(({ id, label, translate = true }, index) => {
          const htmlId = nanoid();
          return (
            <Fragment key={id}>
              <input
                name={radioGroup}
                id={htmlId}
                type="radio"
                value={id}
                checked={id === selected}
                onChange={onChange}
              />
              <label
                htmlFor={htmlId}
                tabIndex={0}
                data-interactive={id === selected ? undefined : true}
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
        className={cx(
          "tab-content",
          classes.content,
          css({ flex: "1", position: "relative", overflow: "auto" }),
        )}
      >
        {/* a surface, so panels in it are nested */}
        <OnSurface>{activeTabDef?.content}</OnSurface>
      </div>
    </div>
  );
};
