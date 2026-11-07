import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { PropsWithChildren } from "react";
import { css } from "../../../styled-system/css";

export const NativeMenuLabel = ({ children }: PropsWithChildren) => {
  return (
    <DropdownMenu.Label asChild>
      <h3
        className={css({
          padding: "0.5em 0.5em 0.5em 0.5em",
          gridColumn: "1 / -1",
          fontSize: "1.2em",
          fontWeight: "bold",
          margin: 0,
        })}
      >
        {children}
      </h3>
    </DropdownMenu.Label>
  );
};
