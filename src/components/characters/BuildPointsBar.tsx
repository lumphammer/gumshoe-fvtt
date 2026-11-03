import { memo, useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";

type BuildPointsCounterProps = {
  label: string;
  total: number;
};

const BuildPointsCounter = ({ label, total }: BuildPointsCounterProps) => {
  const theme = useContext(ThemeContext);
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: "0.5em",
      }}
    >
      <i
        css={{
          font: theme.displayFont,
          textTransform: theme.displayFontTextTransform,
          fontSize: "smaller",
        }}
      >
        <Translate>{label}</Translate>
      </i>
      <span
        css={{
          font: theme.displayFont,
          textTransform: theme.displayFontTextTransform,
          fontSize: "larger",
          lineHeight: 1,
        }}
      >
        {total}
      </span>
    </div>
  );
};

type BuildPointsBarProps = {
  /** the investigative abilities' ratings, added up */
  investigativeTotal: number;
  /** the general abilities' ratings, added up */
  generalTotal: number;
  showInvestigative: boolean;
};

/**
 * A bar of "build point" totals (the sum of the ratings of the character's
 * abilitiy ratings, not really proper build points)
 */
export const BuildPointsBar = memo(function BuildPointsBar({
  investigativeTotal,
  generalTotal,
  showInvestigative,
}: BuildPointsBarProps) {
  const theme = useContext(ThemeContext);
  return (
    <div
      css={{
        position: "sticky",
        // the sticky rect is inset by the tab content scroller's 0.5em padding,
        // so pull back by the same amount to sit flush with the top of the
        // scrollport once stuck
        top: "-0.5em",
        zIndex: 1,
        // ...and cancel the same padding on the other three sides, so the bar
        // is full-bleed and doesn't jump up by 0.5em on first scroll
        marginTop: "-0.5em",
        marginLeft: "-0.5em",
        marginRight: "-0.5em",
        marginBottom: "0.5em",
        padding: "0.5em",
        background: theme.colors.bgOpaquePrimary,
        backdropFilter: "blur(10px)",
        borderStyle: "none none solid none",
        borderColor: theme.colors.controlBorder,
        borderWidth: "1px",
        display: "grid",
        gridTemplateColumns: "minmax(33%, auto) minmax(33%, auto)",
        columnGap: "1em",
      }}
    >
      {showInvestigative && (
        <BuildPointsCounter
          label="Investigative build points"
          total={investigativeTotal}
        />
      )}
      <BuildPointsCounter label="General build points" total={generalTotal} />
    </div>
  );
});
