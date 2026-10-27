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
  block?: boolean;
  rich?: boolean;
};

export const Translate = React.memo<TranslateProps>(
  ({ children, values, title, className, block, rich }) => {
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

    const Tag = block ? "div" : "span";

    return (
      <Tag
        className={className}
        // no title by default: it would hide the title of anything around it
        title={title ?? (debug ? prefixed : undefined)}
        style={{
          background: debug ? (has ? "lightgreen" : "red") : "none",
        }}
        {...(rich
          ? {
              dangerouslySetInnerHTML: {
                __html: foundry.utils.cleanHTML(local),
              },
            }
          : {})}
      >
        {rich ? undefined : local}
      </Tag>
    );
  },
);

Translate.displayName = "Translate";
