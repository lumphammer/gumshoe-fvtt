import { Draft, produce } from "immer";
import {
  Context,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * A minimal case for all actions - there will always be a `type` and a
 * `payload` property, but the payload may be `undefined`.
 */
export type AnyAction = {
  type: string;
  payload?: unknown;
};

/**
 * A minimal reimplementation of the `createAction` function from
 * `@reduxjs/toolkit`.
 *
 * Given a unique string (danger will robinson!) and a reducer function, returns
 * an object with
 *
 *  * a `create` method that returns an action object
 *  * an `apply` function, which take a state and an action and applies the
 *    relevant reducer if the action matches the case
 */
function createCase<S, P = void>(
  type: string,
  reducer: (draft: S, payload: P) => void,
) {
  const create = (payload: P) => ({ type, payload });
  const match = (action: AnyAction): action is { type: string; payload: P } =>
    action.type === type;
  const apply = (state: S, action: AnyAction) => {
    if (match(action)) {
      return reducer ? reducer(state, action.payload) : state;
    }
    return state;
  };
  return {
    /** Create an action (to be dispatched with `dispatch` from `useReducer` */
    create,
    /**
     * given a mutable draft object of S, and action, mutate the draft if the
     * action is from this slice.
     */
    apply,
  };
}

type Reducers<S> = { [key: string]: (state: Draft<S>, payload?: any) => void };

export type CreateSliceArgs = {
  onError?: (error: unknown) => void;
  log?: (...args: unknown[]) => void;
};

/**
 * A minimal reimagination of the `createSlice` function from
 * `@reduxjs/toolkit`.
 * This function is curried so that we can specify S (state) but allow R
 * (reducers) to be inferred.
 */
export const createSlice =
  <S extends object>(args: CreateSliceArgs = {}) =>
  <R extends Reducers<S>>(reducers: R) => {
    // turn all the reducers into cases (so they can be created and applied)
    const sliceCases = Object.entries(reducers).map(([key, reducer]) => {
      const action = createCase(key, reducer);
      return [key, action] as const;
    });
    // turn those cases back into an object of creators.
    const creators = Object.fromEntries(
      sliceCases.map(([key, action]) => [key, action.create]),
    ) as {
      // we need this mad cast because `map` can't give us accurate types.
      // we're just knitting together the `typeof createCase<...>["create"]`
      // and working out the payload type using inference.
      [key in keyof R]: ReturnType<
        typeof createCase<
          S,
          R[key] extends (state: infer _S1) => void
            ? void
            : R[key] extends (state: infer _S1, payload: infer P1) => void
              ? P1
              : never
        >
      >["create"];
    };
    // `useDispatch` takes the initial state as an argument, so we don't need to
    // provide a default argument for `state` here (unlike e.g. a Redux
    // reducer).
    const reducer = (state: S, action: AnyAction) => {
      try {
        const newState = produce(state, (draft) => {
          for (const [, sliceCase] of sliceCases) {
            sliceCase.apply(draft, action);
          }
        });
        if (args.log) {
          args.log(action, state, newState);
        }
        return newState;
      } catch (e) {
        // in the event of an error, we will try to keep going rather than just
        // exploding
        if (args.onError) {
          args.onError(e);
        }
        return state;
      }
    };

    return {
      /**
       * A dictionary of action creators, keyed by the name of the case.
       */
      creators,
      /**
       * The reducer function for this slice.
       */
      reducer,
    };
  };

/**
 * Create a `useSelector` hook that uses the given `context`.
 */
export const createUseSelectorHook = <TState>(context: Context<TState>) => {
  return <TValue>(selector: (state: TState) => TValue) => {
    const state = useContext(context);
    const [value, setValue] = useState<TValue>(selector(state));
    const frozenRef = useRef(false);
    useEffect(() => {
      if (!frozenRef.current) {
        setValue(selector(state));
      }
    }, [selector, state]);
    const freeze = useCallback(() => {
      frozenRef.current = true;
    }, []);
    return { value, freeze };
  };
};
