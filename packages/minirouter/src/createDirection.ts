import { nanoid } from "nanoid";

import type { AnyStep, Direction, Step } from "./types";

export const createDirection = function <TParams = void>(
  description: string,
): Direction<TParams> {
  const direction = (params: TParams): Step<TParams> => {
    return {
      direction,
      params,
      id: nanoid(),
    };
  };

  direction.description = description;
  direction.match = (step: AnyStep | undefined): step is Step<TParams> => {
    return step?.direction === direction;
  };

  return direction;
};
