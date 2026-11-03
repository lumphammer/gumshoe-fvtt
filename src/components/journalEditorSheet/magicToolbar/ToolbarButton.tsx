import React, { useCallback, useContext } from "react";

import { ThemeContext } from "../../../themes/ThemeContext";
import { Button } from "../../inputs/Button";

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
  const theme = useContext(ThemeContext);

  // Use props in your component
  const handleClick = useCallback(() => {
    void onClick();
  }, [onClick]);

  return (
    <Button
      disabled={disabled}
      css={{
        padding: "0.3em",
        lineHeight: "1em",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        flexBasis: "max-content",
        minWidth: "4em",
        color: theme.colors.text,
        ":hover": {
          transform: disabled ? undefined : "scale(1.1)",
        },
        transition: "transform 0.1s ease",
      }}
      onClick={handleClick}
    >
      {Icon && (
        <div css={{ fontSize: "2em" }}>
          <Icon />
        </div>
      )}

      <div css={{}}>{text}</div>
    </Button>
  );
};
