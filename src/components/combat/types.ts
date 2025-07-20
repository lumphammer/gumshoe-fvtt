export type TurnInfo = {
  id: string;
  name: string;
  img: string;
  active: boolean;
  defeated: boolean;
  hidden: boolean;
  initiative: number | undefined | null;
  resource: number | boolean | string | null;
  effects: foundry.documents.ActiveEffect[];
  passingTurnsRemaining: number;
  totalPassingTurns: number;
};
