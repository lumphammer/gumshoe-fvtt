import { RefObject, useLayoutEffect, useRef, useState } from "react";

type FoundryThemeClass = "theme-dark" | "theme-light";

function getLocalFoundryTheme(
  el: HTMLElement | null,
): [HTMLElement | null, FoundryThemeClass] {
  const ancestor = el?.closest(".themed:is(.theme-dark, .theme-light)");
  let theme: FoundryThemeClass = "theme-light";
  if (ancestor && ancestor.classList.contains("theme-dark")) {
    theme = "theme-dark";
  }
  return [ancestor instanceof HTMLElement ? ancestor : null, theme];
}

export function useLocalFoundryTheme(): [
  FoundryThemeClass,
  RefObject<HTMLElement | null>,
] {
  const ref = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<FoundryThemeClass>("theme-light");
  useLayoutEffect(() => {
    const [ancestor, theme] = getLocalFoundryTheme(ref.current);
    setTheme(theme);
    if (ref.current === null || ancestor === null) {
      return;
    }
    const observer = new MutationObserver((mutations) => {
      const [_, theme] = getLocalFoundryTheme(ref.current);
      setTheme(theme);
    });
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [ref]);
  return [theme, ref];
}
