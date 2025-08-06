import { Fragment, memo, PropsWithChildren } from "react";

import { useOutletProvider } from "./useOutletProvider";

/**
 * A dead-simple outlet to show how to use the useOutletProvider hook. Don't
 * actually use this - routes can render themselves if they're not in an Outlet.
 */
export const Outlet = memo<PropsWithChildren>(({ children }) => {
  const { content, registry } = useOutletProvider(children);
  return (
    <>
      {Object.entries(registry).map(([id, content]) => (
        <Fragment key={id}>{content}</Fragment>
      ))}
      {content}
    </>
  );
});

Outlet.displayName = "Outlet";
