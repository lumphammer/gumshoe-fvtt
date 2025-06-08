import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { PropsWithChildren } from "react";

export const NativeMenuLabel = ({ children }: PropsWithChildren) => (
  <DropdownMenu.Label asChild>
    <h3
      css={{
        padding: "0.5em 0.5em 0.5em 0.5em",
        gridColumn: "1 / -1",
        fontSize: "1.2em",
        fontWeight: "bold",
        margin: 0,
      }}
    >
      {children}
    </h3>
  </DropdownMenu.Label>
);
