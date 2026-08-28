type RequestingUser = {
  id: string;
  isGM: boolean;
};

type ControlledCombatant = {
  players: ReadonlyArray<{ id: string }>;
};

export function canUserRequestCombatAction(
  user: RequestingUser,
  combatant: ControlledCombatant | null | undefined,
): boolean {
  return (
    user.isGM ||
    combatant?.players.some((player) => player.id === user.id) === true
  );
}
