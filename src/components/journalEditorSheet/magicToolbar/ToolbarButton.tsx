import React, { useCallback } from "react";

import { Button } from "../../inputs/Button";
import { css } from "../../../styled-system/css";

type ToolbarButtonProps = {
  text?: React.ReactNode;
  icon?: React.ComponentType;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

export const ToolbarButton = ({
  onClick,
  text,
  icon: Icon,
  disabled = false,
}: ToolbarButtonProps) => {
  // Use props in your component
  const handleClick = useCallback(() => {
    void onClick();
  }, [onClick]);

  return (
    <Button
      kind="toolbar"
      disabled={disabled}
      className={css({
        padding: "0.3em",
        lineHeight: "1em",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        flexBasis: "max-content",
        minWidth: "4em",
        "&:hover": {
          transform: disabled ? undefined : "scale(1.1)",
        },
        transition: "[transform 0.1s ease]",
      })}
      onClick={handleClick}
    >
      {Icon && (
        <div className={css({ fontSize: "2em" })}>
          <Icon />
        </div>
      )}

      <div className={css({})}>{text}</div>
    </Button>
  );
};
