import type { PropsWithChildren, ReactNode } from "react";
import React, { useContext } from "react";

import { CloseContext } from "./Dropdown";

interface MenuProps {
  className?: string;
}

export const Menu = ({ children, className }: PropsWithChildren<MenuProps>) => {
  return (
    <div
      className={`menu-outer ${className}`}
      css={{
        background: "#123",
        color: "#abc",
        padding: "0",
        border: "1px solid currentColor",
        boxShadow: "0 0.5em 0.5em 0.2em #0007",
      }}
    >
      {children}
    </div>
  );
};

interface MenuItemProps {
  icon: ReactNode;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export const MenuItem = ({
  icon,
  children,
  onClick: onClickOrig,
}: PropsWithChildren<MenuItemProps>) => {
  const close = useContext(CloseContext);

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    close();
    event.preventDefault();
    event.stopPropagation();
    onClickOrig(event);
  };

  return (
    <a
      onClick={onClick}
      css={{
        display: "flex",
        flexDirection: "row",
        minHeight: "2em",
        maxHeight: "max-content",
        borderBottom: "1px solid currentColor",
        transition: "background-color 300ms ease-out",
        cursor: "pointer",
        ":hover": {
          backgroundColor: "#345",
          color: "#def",
          transition: "background-color 0ms ",
          textShadow: "0 0 0.25em currentColor",
        },
      }}
    >
      <div
        css={{
          width: "3em",
          borderRight: "1px solid currentColor",
          position: "relative",
        }}
      >
        <div
          css={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        css={{
          padding: "0.5em",
        }}
      >
        {children}
      </div>
    </a>
  );
};
