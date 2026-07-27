import React, { PropsWithChildren } from "react";

import { systemLogger } from "../functions/utilities";
import { absoluteCover } from "./absoluteCover";

// eslint-disable-next-line typescript/no-empty-object-type
type ErrorBoundaryProps = PropsWithChildren<{}>;

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    systemLogger.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          css={{
            ...absoluteCover,
            padding: "1em",
            backgroundColor: "#222",
            color: "#eee",
            overflow: "auto",
          }}
        >
          <h1>Alas! Something went wrong 😔</h1>
          <p>
            If this continues to happen, please drop into the{" "}
            <a href="https://discord.com/channels/692113540210753568/720741108937916518">
              virtual_tabletops channel on the Pelgrane Press Discord server
            </a>{" "}
            and let us know.
          </p>
          <p>
            Alternatively, you can{" "}
            <a href="https://github.com/n3dst4/investigator-fvtt/issues">
              log an issue on GitHub
            </a>{" "}
            .
          </p>
          <h2>Details</h2>
          <pre>
            <code>{this.state.error.message}</code>
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
