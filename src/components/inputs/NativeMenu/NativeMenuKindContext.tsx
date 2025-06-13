import { createContext, useContext } from "react";

type MenuKind = "dropdown" | "context";

const NativeMenuKindContext = createContext<MenuKind | null>(null);

export const NativeMenuKindProvider = ({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: MenuKind;
}) => {
  return (
    <NativeMenuKindContext.Provider value={kind}>
      {children}
    </NativeMenuKindContext.Provider>
  );
};

export const useNativeMenuKind = (): MenuKind => {
  const menuKind = useContext(NativeMenuKindContext);
  if (!menuKind) {
    throw new Error("NativeMenuKindContext not found");
  }
  return menuKind;
};
