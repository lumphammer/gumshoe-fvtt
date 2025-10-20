import { useEffect, useRef, useState } from "react";

import { useRefStash } from "../../hooks/useRefStash";
import { mountedStates, showingStates, TransitionState } from "./shared";

export function useShowHideTransition(show: boolean, duration: number) {
  const [transitionState, setTransitionState] = useState(
    show ? TransitionState.entering : TransitionState.exited,
  );

  const durationRef = useRefStash(duration);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransitionState(TransitionState.startEntering);
      timeoutId = setTimeout(() => {
        setTransitionState(TransitionState.entering);
        timeoutId = setTimeout(() => {
          setTransitionState(TransitionState.entered);
        }, 0);
      }, 0);
    } else {
      setTransitionState(TransitionState.exiting);
      timeoutId = setTimeout(() => {
        setTransitionState(TransitionState.exited);
      }, durationRef.current);
    }

    timeoutRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
    };
  }, [durationRef, show]);

  return {
    transitionState,
    shouldMount: mountedStates.includes(transitionState),
    isShowing: showingStates.includes(transitionState),
  };
}
