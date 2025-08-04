import { CSSObject } from "@emotion/react";

import { useHover } from "../../hooks/useHover";
import { Button } from "../inputs/Button";
import { useShowHideTransition } from "../transitions/useShowHideTransition";
import { Translate } from "../Translate";
import { MWResult } from "./types";

type MwButtonProps = {
  deets: MWResult;
  onClick?: () => void;
};

const basicShadow = "0 0 0.5em 0 #0007";

export const MwButton = ({ onClick: onClickProp, deets }: MwButtonProps) => {
  const { hover, onMouseEnter, onMouseLeave } = useHover();

  const style: CSSObject = {
    textAlign: "center",
    padding: "0.2em",
    gridArea: "body",
    marginTop: "0.5em",
    borderRadius: "2em",
    borderStyle: "none",
    backgroundImage: [
      `radial-gradient(closest-side, ${deets.color}77 0%, ${deets.color}00 100%)`,
      "linear-gradient(to bottom, #999, #000)",
    ].join(", "),
    boxShadow: basicShadow,
    fontFamily: "'Longdon Decorative Regular', sans-serif",
    fontSize: "1.5em",
  };

  const { isShowing: isShowingDeets, shouldMount: shouldMountDeets } =
    useShowHideTransition(!hover, 800);
  const { isShowing: isShowingReRoll, shouldMount: shouldMountReRoll } =
    useShowHideTransition(hover, 800);

  const content = (
    <>
      <div
        css={{
          color: "#fff",
          borderStyle: "solid",
          borderWidth: "2px",
          borderColor: "#fff",
          borderRadius: "1em",
          textShadow: [
            `0 0 0.5em ${deets.color}`,
            `0 0 0.2em ${deets.color}`,
            `0 0 1em ${deets.color}`,
            `0 0 2em ${deets.color}`,
          ].join(","),
          boxShadow: [
            `0 0 0.5em 0 inset ${deets.color}`,
            `0 0 0.5em 0 ${deets.color}`,
          ].join(","),
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          gridTemplateAreas: "'area'",
        }}
      >
        {/* <CSSTransition
          in={!hover}
          timeout={1000}
          classNames={{
            ...fadeInOutClasses,
          }}
          unmountOnExit
        >
          <span css={{ gridArea: "area" }}>{deets.text}</span>
        </CSSTransition> */}
        {shouldMountDeets && (
          <span
            css={{ gridArea: "area" }}
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
          <span css={{ gridArea: "area" }}>
            <Translate>Re-Roll</Translate> <i className="fas fa-sync fa-spin" />
          </span>
        </CSSTransition> */}
        {shouldMountReRoll && (
          <span
            css={{ gridArea: "area" }}
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
    <Button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickProp}
      css={style}
    >
      {content}
    </Button>
  ) : (
    <div css={style}>{content}</div>
  );
};
