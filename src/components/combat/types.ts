export type Effect = {
  img: string;
  name: string;
};

export type TurnInfo = {
  id: string;
  name: string;
  img: string;
  active: boolean;
  owner: boolean;
  defeated: boolean;
  hidden: boolean;
  initiative: number | undefined | null;
  hasRolled: boolean;
  hasResource: boolean;
  resource: number | boolean | `${number}` | null;
  effects: Effect[];
  passingTurnsRemaining: number;
  totalPassingTurns: number;
};
