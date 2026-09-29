import type { ReactNode } from "react";

export type MagicToolbarContentEntry = {
  category: string;
  content: ReactNode;
};

export type MagicToolbarContent = Record<string, MagicToolbarContentEntry>;

export type MagicToolBarRegister = (
  id: string,
  content: MagicToolbarContentEntry,
) => void;

export type MagicToolBarUnregister = (id: string) => void;

export type MagicToolbarRegisterContextDataValue = {
  register: MagicToolBarRegister;
  unregister: MagicToolBarUnregister;
};
