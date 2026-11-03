import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import { useActorTheme } from "../../hooks/useActorTheme";
import type { PCActor } from "../../module/actors/pc";
import { CSSReset } from "../CSSReset";
import { TeamCrisisPanel } from "./TeamCrisisPanel";

/** What the window gives the panel (see `TeamCrisisApp`) */
export type TeamCrisisWindowApp = {
  actor: PCActor;
  teammateUuids: string[];
  close: () => Promise<unknown>;
};

/**
 * The Team Crisis panel in a window of its own, opened from a GM's call in
 * chat, in the Agent's theme. Everything in it reads the Agent and settings
 * through snapshots, so Foundry's renders don't reach it (the app passes
 * `rerenderOnFoundryRender: false`).
 */
export const TeamCrisisWindow = () => {
  const app = useContext(FoundryAppContext) as unknown as TeamCrisisWindowApp;
  const theme = useActorTheme(app.actor);
  return (
    <CSSReset
      theme={theme}
      mode="small"
      css={{ position: "absolute", inset: 0, overflow: "auto", padding: "1em" }}
    >
      <TeamCrisisPanel
        actor={app.actor}
        initialTeammateUuids={app.teammateUuids}
        onDone={() => void app.close()}
      />
    </CSSReset>
  );
};

TeamCrisisWindow.displayName = "TeamCrisisWindow";
