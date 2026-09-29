import type { ComponentProps, PropsWithChildren } from "react";
import React from "react";

type ButtonProps = ComponentProps<"button"> &
  PropsWithChildren<{
    onClick: () => void;
    className?: string;
  }>;

export const Button = React.memo<ButtonProps>(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, onClick, className, ...rest }, ref) => {
      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onClick();
      };

      return (
        <button
          ref={ref}
          {...rest}
          className={className}
          onClick={handleClick}
          css={{
            padding: "0.1em 0.3em",
          }}
        >
          {children}
        </button>
      );
    },
  ),
);

Button.displayName = "Button";

export const ToolbarButton = React.memo<ButtonProps>(
  ({ children, onClick, className, ...rest }) => {
    return (
      <Button
        {...rest}
        className={className}
        css={{
          display: "block",
          width: "max-content",
        }}
        onClick={onClick}
      >
        {children}
      </Button>
    );
  },
);

ToolbarButton.displayName = "ToolbarButton";
