export type Effect = {
  img: string;
  name: string;
};

export type TurnInfo = {
  id: string;
  name: string;
  img: string;
  active: boolean;
  defeated: boolean;
  hidden: boolean;
  initiative: number | undefined | null;
  resource: number | boolean | string | null;
  effects: Effect[];
  passingTurnsRemaining: number;
  totalPassingTurns: number;
};
