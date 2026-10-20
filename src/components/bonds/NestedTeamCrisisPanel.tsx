import { useNavigationContext } from "@lumphammer/minirouter";

import type { PCActor } from "../../module/actors/pc";
import { TeamCrisisPanel } from "./TeamCrisisPanel";

/** The Team Crisis panel as a nested route on the Bonds tab */
export const NestedTeamCrisisPanel = ({ actor }: { actor: PCActor }) => {
  const { navigate } = useNavigationContext();
  return (
    <TeamCrisisPanel actor={actor} onDone={() => navigate("here", "up")} />
  );
};

NestedTeamCrisisPanel.displayName = "NestedTeamCrisisPanel";
