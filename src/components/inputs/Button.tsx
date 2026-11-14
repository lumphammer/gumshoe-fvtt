import type { ComponentProps, PropsWithChildren } from "react";
import React from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { cx } from "../../styled-system/css";
import { button, type ButtonVariantProps } from "../../styled-system/recipes";

type ButtonProps = ComponentProps<"button"> &
  ButtonVariantProps &
  PropsWithChildren<{
    onClick: () => void;
    className?: string;
  }>;

/** A themed button (the catalogue's `button`). Disabled when the sheet isn't editable. */
export const Button = React.memo<ButtonProps>(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, onClick, className, disabled, kind, ...rest }, ref) => {
      const isEditable = useIsEditable();
      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onClick();
      };

      return (
        <button
          ref={ref}
          type="button"
          data-interactive
          {...rest}
          disabled={(disabled ?? false) || !isEditable}
          className={cx(
            button({ kind }),
            // layout, which call sites can change (componentDefaults.css)
            kind === "toolbar"
              ? "inv-default-button-fit"
              : "inv-default-button",
            className,
          )}
          onClick={handleClick}
        >
          {children}
        </button>
      );
    },
  ),
);

Button.displayName = "Button";

/** A compact button that's only as wide as its content. */
export const ToolbarButton = React.memo<ButtonProps>(
  ({ children, onClick, className, ...rest }) => {
    return (
      <Button kind="toolbar" {...rest} className={className} onClick={onClick}>
        {children}
      </Button>
    );
  },
);

ToolbarButton.displayName = "ToolbarButton";
