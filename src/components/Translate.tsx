import Case from "case";
import React, { useMemo } from "react";

import { systemId } from "../constants";
import { assertGame } from "../functions/isGame";
import { getDevMode } from "../functions/utilities";
import { settings } from "../settings/settings";

type TranslateProps = {
  children: string;
  values?: { [key: string]: string };
  title?: string;
  className?: string;
};

export const Translate = React.memo<TranslateProps>(
  ({ children, values, title, className }) => {
    assertGame(game);
    const debug = settings.debugTranslations.get() && getDevMode();
    const pascal = useMemo(() => Case.pascal(children), [children]);
    const prefixed = `${systemId}.${pascal}`;
    const local = useMemo(() => {
      assertGame(game);
      return game.i18n.format(prefixed, values);
    }, [prefixed, values]);
    const has = useMemo(() => {
      assertGame(game);
      return game.i18n.has(prefixed, false);
    }, [prefixed]);

    return (
      <span
        className={className}
        title={title ?? (debug ? prefixed : local)}
        style={{
          background: debug ? (has ? "lightgreen" : "red") : "none",
        }}
      >
        {local}
      </span>
    );
  },
);

Translate.displayName = "Translate";
