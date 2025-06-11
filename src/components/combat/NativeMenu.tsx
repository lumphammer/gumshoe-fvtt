import { cx } from "@emotion/css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { RefObject, useLayoutEffect, useRef, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";

type FoundryThemeClass = "theme-dark" | "theme-light";

const log = console.log.bind(console, "[menu]");

function getLocalFoundryTheme(
  el: HTMLElement | null,
): [HTMLElement | null, FoundryThemeClass] {
  log("el", el);
  const ancestor = el?.closest(".themed:is(.theme-dark, .theme-light)");
  log("ancestor", ancestor);
  let theme: FoundryThemeClass = "theme-light";
  if (ancestor && ancestor.classList.contains("theme-dark")) {
    theme = "theme-dark";
  }
  log("theme", theme);
  return [ancestor instanceof HTMLElement ? ancestor : null, theme];
}

function useLocalFoundryTheme(
  ref: RefObject<HTMLElement | null>,
): FoundryThemeClass {
  const [theme, setTheme] = useState<FoundryThemeClass>("theme-light");
  useLayoutEffect(() => {
    log("running effect");
    const [ancestor, theme] = getLocalFoundryTheme(ref.current);
    setTheme(theme);
    if (ref.current === null || ancestor === null) {
      return;
    }
    const observer = new MutationObserver((mutations) => {
      log("mutations", mutations);
      const [_, theme] = getLocalFoundryTheme(ref.current);
      setTheme(theme);
    });
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [ref]);
  return theme;
}

type NativeMenuItemProps = {
  children: React.ReactNode;
  onSelect: (event: Event) => void;
  icon?: React.ReactNode;
};

const NativeMenuItem = ({ children, onSelect, icon }: NativeMenuItemProps) => {
  return (
    <DropdownMenu.Item
      css={{
        border: "1px solid transparent",
        padding: "8px",
        lineHeight: "15px",
        fontSize: "var(--font-size-12)",
        cursor: "var(--cursor-pointer)",
        transition: "0.1s",
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "1/-1",
        columnGap: "0.5em",
        // foundry
        ":hover": {
          border: "1px solid var(--hover-entry-border)",
          background: "var(--hover-entry-background)",
          color: "var(--hover-text-color)",
        },
      }}
      onSelect={onSelect}
    >
      <span css={{ marginRight: "0.5em" }}>{icon}</span>
      {children}
    </DropdownMenu.Item>
  );
};

type NativeMenuProps = {
  className?: string;
  children: React.ReactNode;
  label?: React.ReactNode;
};

export const NativeMenu = ({ className, children, label }: NativeMenuProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const theme = useLocalFoundryTheme(triggerRef);

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={cx("inline-control", className)}>
        {label ?? <FaEllipsisV />}
        <span css={{ display: "none" }} ref={triggerRef}></span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          avoidCollisions={true}
          collisionBoundary={document.body}
          collisionPadding={10}
          align="center"
          side="bottom"
          className={cx("themed", theme)}
          css={{
            // from .themed.theme-dark#context-menu</DropdownMenu.Portal>
            ...(theme === "theme-dark"
              ? {
                  "--background-color": "var(--color-cool-5)",
                  "--border-color": "var(--color-cool-3)",
                  "--text-color": "var(--color-text-secondary)",
                  "--hover-text-color": "var(--color-text-emphatic)",
                  "--group-separator": "var(--color-cool-4)",
                  "--hover-entry-border": "var(--color-cool-4)",
                  "--hover-entry-background": "var(--color-dark-1)",
                }
              : {
                  // light
                  "--background-color": "#d9d8c8",
                  "--border-color": "#999",
                  "--text-color": "var(--color-text-secondary)",
                  "--hover-text-color": "var(--color-text-emphatic)",
                  "--group-separator": "#999",
                  "--hover-entry-border": "#999",
                  "--hover-entry-background": "#f0f0e0",
                }),
            // from #context-menu
            height: "max-content",
            minWidth: "150px",
            maxWidth: "360px",
            background: "var(--background-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "5px",
            color: "var(--text-color)",
            width: "100%",
            zIndex: "calc(var(--z-index-app) + 1)",
            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.45)",
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
          }}
          // we should be able to recycle foundry's styles for #context-menu,
          // but 1. it's an id and we can in theory display >1 menu at once,
          // and 2. it applies `position: absolute`, which ballses up
          // positioning
          // id="context-menu"
        >
          {children}
          <DropdownMenu.Arrow
            width={10}
            height={10}
            css={{ fill: "var(--border-color)" }}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

NativeMenu.Item = NativeMenuItem;
