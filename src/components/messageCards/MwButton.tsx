import { useHover } from "../../hooks/useHover";
import { css } from "../../styled-system/css";
import { NativeButton } from "../native/NativeButton";
import { useShowHideTransition } from "../transitions/useShowHideTransition";
import { Translate } from "../Translate";
import type { MWResult } from "./types";

type MwButtonProps = {
  deets: MWResult;
  onClick?: () => void;
};

// the result's colour is `--mw-color`, set inline: it varies by roll
const resultColor = (alpha: string) =>
  `rgb(from var(--mw-color) r g b / ${alpha})`;

const buttonClass = css({
  textAlign: "center",
  padding: "0.2em",
  gridArea: "body",
  marginTop: "0.5em",
  borderRadius: "[2em]",
  borderStyle: "none",
  backgroundImage: `radial-gradient(closest-side, ${resultColor("0.467")} 0%, ${resultColor("0")} 100%), linear-gradient(to bottom, #999, #000)`,
  boxShadow: "[0 0 0.5em 0 #0007]",
  fontFamily: "'Longdon Decorative Regular', sans-serif",
  fontSize: "1.5em",
});

export const MwButton = ({ onClick: onClickProp, deets }: MwButtonProps) => {
  const { hover, onMouseEnter, onMouseLeave } = useHover();

  const colorVar = { "--mw-color": deets.color } as React.CSSProperties;

  const { isShowing: isShowingDeets, shouldMount: shouldMountDeets } =
    useShowHideTransition(!hover, 800);
  const { isShowing: isShowingReRoll, shouldMount: shouldMountReRoll } =
    useShowHideTransition(hover, 800);

  const content = (
    <>
      <div
        className={css({
          color: "[#fff]",
          borderStyle: "solid",
          borderWidth: "2px",
          borderColor: "[#fff]",
          borderRadius: "[1em]",
          textShadow:
            "[0 0 0.5em var(--mw-color),0 0 0.2em var(--mw-color),0 0 1em var(--mw-color),0 0 2em var(--mw-color)]",
          boxShadow:
            "[0 0 0.5em 0 inset var(--mw-color),0 0 0.5em 0 var(--mw-color)]",
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          gridTemplateAreas: "'area'",
        })}
      >
        {/* <CSSTransition
          in={!hover}
          timeout={1000}
          classNames={{
            ...fadeInOutClasses,
          }}
          unmountOnExit
        >
          <span className={css({ gridArea: "area" })}>{deets.text}</span>
        </CSSTransition> */}
        {shouldMountDeets && (
          <span
            className={css({ gridArea: "area" })}
            style={{
              opacity: isShowingDeets ? 1 : 0,
              transition: isShowingDeets
                ? "opacity 400ms 400ms"
                : "opacity 400ms",
            }}
          >
            {deets.text}
          </span>
        )}
        {/* <CSSTransition
          in={hover}
          timeout={1000}
          classNames={{
            ...fadeInOutClasses,
          }}
          unmountOnExit
        >
          <span className={css({ gridArea: "area" })}>
            <Translate>Re-Roll</Translate> <i className="fas fa-sync fa-spin" />
          </span>
        </CSSTransition> */}
        {shouldMountReRoll && (
          <span
            className={css({ gridArea: "area" })}
            style={{
              opacity: isShowingReRoll ? 1 : 0,
              transition: isShowingReRoll
                ? "opacity 400ms 400ms"
                : "opacity 400ms",
            }}
          >
            <Translate>Re-Roll</Translate>
          </span>
        )}
      </div>
    </>
  );

  return onClickProp ? (
    <NativeButton
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickProp}
      className={buttonClass}
      style={colorVar}
    >
      {content}
    </NativeButton>
  ) : (
    <div className={buttonClass} style={colorVar}>
      {content}
    </div>
  );
};
