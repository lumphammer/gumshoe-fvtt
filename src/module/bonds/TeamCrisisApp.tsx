import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import type { TeamCrisisWindowApp } from "../../components/bonds/TeamCrisisWindow";
import { TeamCrisisWindow } from "../../components/bonds/TeamCrisisWindow";
import { systemId } from "../../constants";
import { getTranslated } from "../../functions/getTranslated";
import { ApplicationV2 } from "../../fvtt-exports";
import type { PCActor } from "../actors/pc";

class TeamCrisisAppBase extends ApplicationV2 implements TeamCrisisWindowApp {
  static DEFAULT_OPTIONS = {
    // not "dialog": that's for Foundry's prompts
    classes: [systemId, "sheet"],
    position: { width: 560, height: 760 },
    window: { resizable: true },
  };

  // set straight after construction, before the first render
  actor!: PCActor;
  teammateUuids: string[] = [];
}

const TeamCrisisApp = ReactApplicationV2Mixin(
  "TeamCrisisApp",
  TeamCrisisAppBase,
  () => <TeamCrisisWindow />,
);

/** one window per Agent */
const openWindows = new Map<string, InstanceType<typeof TeamCrisisApp>>();

/**
 * Open a window for an Agent's Stability test after a team crisis, with
 * their teammates ticked. Opening it again starts afresh.
 */
export async function openTeamCrisisWindow(
  actor: PCActor,
  teammateUuids: string[],
): Promise<void> {
  const id = actor.id ?? "";
  await openWindows.get(id)?.close();
  const app = new TeamCrisisApp({
    id: `${systemId}-team-crisis-${id}`,
    window: {
      title: getTranslated("TeamCrisisForActorName", {
        ActorName: actor.name ?? "",
      }),
    },
  });
  app.actor = actor;
  app.teammateUuids = teammateUuids;
  openWindows.set(id, app);
  await app.render({ force: true });
}
