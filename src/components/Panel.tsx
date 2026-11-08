import {
  type ComponentProps,
  createContext,
  type PropsWithChildren,
  useContext,
} from "react";

import { cx } from "../styled-system/css";
import { panel, type PanelVariantProps } from "../styled-system/recipes";

type Depth = NonNullable<PanelVariantProps["depth"]>;

const DepthContext = createContext<Depth>("top");

/**
 * Marks its children as content inside content, so panels in it are
 * `nested`. For a surface that isn't a `<Panel>`, such as a tab's
 * content.
 */
export const OnSurface = ({ children }: PropsWithChildren) => (
  <DepthContext.Provider value="nested">{children}</DepthContext.Provider>
);

/**
 * A block of content on the sheet (the catalogue's `panel`). Its depth comes
 * from where it sits: a panel inside a panel is `nested`.
 */
export const Panel = ({
  className,
  children,
  ...rest
}: ComponentProps<"div">) => {
  const depth = useContext(DepthContext);
  return (
    <div {...rest} className={cx(panel({ depth }), className)}>
      <OnSurface>{children}</OnSurface>
    </div>
  );
};
