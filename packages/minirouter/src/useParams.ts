import type { AnyDirection, Direction } from "./types";
import { useNavigationContext } from "./useNavigationContext";

type ParamsFromDirection<T extends AnyDirection> =
  T extends Direction<infer TParams> ? TParams : never;

export function useParams<TDirection extends AnyDirection>(
  direction: TDirection,
): ParamsFromDirection<TDirection> {
  const { currentStep, parentSteps } = useNavigationContext();
  const allSteps = [...parentSteps, ...(currentStep ? [currentStep] : [])];
  // const step = allSteps.find(direction.match);
  const params = allSteps.find((s) => s.direction === direction)?.params;

  if (params === undefined) {
    throw new Error(`Could not find step for ${direction.description}`);
  }
  return params;
}
