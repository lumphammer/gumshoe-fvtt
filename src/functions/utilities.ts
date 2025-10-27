import * as constants from "../constants";
import { RequestTurnPassArgs, SocketHookAction } from "../types";

interface NameHaver {
  name: string | null;
}

export function trimLeadingPunctuation(s: string) {
  return s.replace(/^[\s\p{P}]+/gu, "");
}

export const sortEntitiesByName = <T extends NameHaver>(ents: T[]) => {
  return ents.toSorted((a, b) => {
    const aName = trimLeadingPunctuation(a.name || "");
    const bName = trimLeadingPunctuation(b.name || "");
    return aName.localeCompare(bName);
  });
};

function isMapIndexFunction<T>(
  x: T | ((index: number) => T),
): x is (index: number) => T {
  return typeof x === "function";
}

/**
 * Given an array (or nullish), a desired length, and a padding element, return
 * an array which is at least the desired length by padding the original if
 * necessary.
 */
export const padLength = <T>(
  originalArray: T[] | null | undefined,
  desiredlength: number,
  paddingElement: T | ((index: number) => T),
): T[] => {
  const originalLength = originalArray?.length ?? 0;
  const paddingSize = Math.max(0, desiredlength - originalLength);
  const padding = isMapIndexFunction(paddingElement)
    ? new Array(paddingSize)
        .fill(0)
        .map((_, i) => paddingElement(i + originalLength))
    : new Array(paddingSize).fill(paddingElement);
  const result = [...(originalArray || []), ...padding];
  return result;
};

/**
 * Given an array (or nullish), a desired length, and a padding element, return
 * an array which is exactly the desired length by either padding or truncating
 * the original.
 */
export const fixLength = <T>(
  originalArray: T[] | null | undefined,
  desiredlength: number,
  paddingElement: T,
): T[] => {
  const padded = padLength(originalArray, desiredlength, paddingElement);
  const result = padded.slice(0, desiredlength);
  return result;
};

export const mapValues = <V1, V2, K extends string = string>(
  mapper: (v: V1, k: K, i: number) => V2,
  subject: { [k in K]: V1 },
): { [k in K]: V2 } => {
  const result: { [k: string]: V2 } = {};
  let i = 0;
  for (const k in subject) {
    result[k] = mapper(subject[k], k, i);
    i += 1;
  }
  return result as { [k in K]: V2 };
};

export const isNullOrEmptyString = (x: any) => {
  return x === null || x === undefined || x === "";
};

// Folder type is a bit fucky rn
export const getFolderDescendants = <T extends Document>(folder: any): T[] => {
  return [...folder.children.flatMap(getFolderDescendants), ...folder.content];
};

// version of Object.prototype.hasOwnProperty that's safe even when prototype
// has been overridden
export const hasOwnProperty = (x: any, y: string) =>
  Object.prototype.hasOwnProperty.call(x, y);

// /**
//  * Check that `game` has been initialised
//  */
// export function isGame(game: any): game is Game {
//   return game instanceof Game;
// }

// /**
//  * Throw if `game` has not been initialized. This is hyper unlikely at runtime
//  * but technically possible during a calamitous upfuckage to TS keeps us honest
//  * and requires a check.
//  */
// export function assertGame(game: any): asserts game is ReadyGame {
//   if (!isGame(game)) {
//     throw new Error("game used before init hook");
//   }
// }

/**
 * The developer mode package allows any module to be put into "debug mode".
 * This is just a convenience function to get the curent value of the debug flag
 * for INVESTIGATOR.
 */
export function getDevMode() {
  return !!(game?.modules?.get("_dev-mode") as any)?.api?.getPackageDebugValue(
    constants.systemId,
  );
}

export function assertNotNull<T>(t: T | undefined | null): asserts t is T {
  if (t === undefined) {
    throw new Error("t was undefined");
  }
}

/**
 * create a new object with a key "renamed" in the same order
 * this keeps the renamed key in the same relative order, if you're relying on
 * JS's object key order being stable
 */
export function renameProperty<T>(
  oldProp: string,
  newProp: string,
  subject: Record<string, T>,
) {
  const result: Record<string, T> = {};
  for (const p in subject) {
    if (p === oldProp) {
      result[newProp] = subject[oldProp];
    } else {
      result[p] = subject[p];
    }
  }
  return result;
}

/**
 * Send out a socket message to all clients, causing them to call the given hook
 * with the given payload.
 */
function broadcastHook<T>(hook: string, payload: T) {
  const socketHookAction: SocketHookAction<T> = {
    hook,
    payload,
  };
  game.socket?.emit(constants.socketScope, socketHookAction);
  Hooks.call(hook as any, payload);
}

/**
 * request the GM's client to pass the turn to the given combatant
 */
export function requestTurnPass(combatantId: string | null | undefined) {
  if (!combatantId) return;
  const payload: RequestTurnPassArgs = { combatantId };
  broadcastHook(constants.requestTurnPass, payload);
}

export const makeLogger = (name: string) =>
  console.log.bind(console, `[${name}]`);

/**
 * Get a file from the user's computer and return it as a string.
 * Nicked off from various sources:
 * https://code-boxx.com/read-files-javascript/
 * https://github.com/GoogleChromeLabs/text-editor/blob/e3a33c2c0b1832ecdb7221f17d7f8a1b23e1ad19/src/inline-scripts/fallback.js#L28
 * https://stackoverflow.com/questions/26754486/how-to-convert-arraybuffer-to-string
 */
export async function getUserFile(accept: string): Promise<string> {
  const filePicker = document.createElement("input");
  filePicker.type = "file";
  filePicker.accept = accept;
  const file = await new Promise<File>((resolve, reject) => {
    filePicker.onchange = () => {
      const file = filePicker.files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error("Aborted"));
      }
    };
    filePicker.oncancel = () => {
      reject(new Error("Aborted"));
    };
    filePicker.click();
  });
  const reader = new FileReader();
  const textPromise = new Promise<string>((resolve, reject) => {
    reader.addEventListener("loadend", () => {
      const text =
        reader.result === null
          ? ""
          : typeof reader.result === "string"
            ? reader.result
            : new TextDecoder("utf-8").decode(new Uint8Array(reader.result));
      resolve(text);
    });
  });
  reader.readAsText(file);
  return textPromise;
}

export const mapObject =
  <T, U>(fn: (val: T, key: string, i: number) => U) =>
  (obj: Record<string, T>): Record<string, U> => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val], i) => [key, fn(val, key, i)]),
    );
  };

export function moveKeyUp<V>(
  obj: Record<string, V>,
  key: string,
): Record<string, V> {
  const entries = Object.entries(obj);
  const index = entries.findIndex(([k]) => k === key);
  if (index === 0) {
    throw new Error(`Cannot move up from index ${index}`);
  }
  if (index >= entries.length || index < 0) {
    throw new Error(`Index ${index} out of range`);
  }
  const item = entries[index];
  entries.splice(index, 1);
  entries.splice(index - 1, 0, item);
  const result = Object.fromEntries(entries);
  return result;
}

export function moveKeyDown<V>(
  obj: Record<string, V>,
  key: string,
): Record<string, V> {
  const entries = Object.entries(obj);
  const index = entries.findIndex(([k]) => k === key);
  if (index === entries.length - 1) {
    throw new Error("Cannot move down from last index");
  }
  if (index >= entries.length || index < 0) {
    throw new Error(`Index ${index} out of range`);
  }
  const cat = entries[index];
  entries.splice(index, 1);
  entries.splice(index + 1, 0, cat);
  const result = Object.fromEntries(entries);
  return result;
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type LoggerFn = (...args: any[]) => void;

function brand(fn: LoggerFn) {
  return fn.bind(
    null,
    `%c${constants.systemId}`,
    `
      color: white;
      background: #1d5d5d;
      padding: 0px 0.5em;
      border-radius: 1em;
      border: 1px solid oklch(0.7 0.0633 195.09);
      background-image: linear-gradient(
        90deg,
        oklch(0.4387 0.0633 195.09) 0%,
        oklch(0.6068 0.0633 195.09) 100%
      );
      `,
  );
}

export const systemLogger = {
  log: brand(console.log),
  info: brand(console.info),
  warn: brand(console.warn),
  error: brand(console.error),
  debug: brand(console.debug),
};

/**
 * A very simple memoization function that only works for nullary functions.
 */
export function memoizeNullaryOnce<T>(fn: () => T): () => T {
  // doing state like this helps TS understand that when state[0] is true,
  // state[1] is defined
  let state: [true, T] | [false] = [false];
  return () => {
    if (!state[0]) {
      state = [true, fn()];
    }
    return state[1];
  };
}

/**
 * Sort an array of objects by a string key
 */
export function sortByKey<T, K extends keyof T>(
  xs: T[],
  k: K & (T[K] extends string | null | number ? K : never),
): T[] {
  return xs.toSorted((a, b) => {
    const aK = a[k] ?? "";
    const bK = b[k] ?? "";
    if (typeof aK === "number" && typeof bK === "number") {
      return aK - bK;
    } else {
      return aK.toString().localeCompare(bK.toString());
    }
  });
}

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Simple throttle function handling user inputs.
 *
 * The returned function always returns void, so it's not suitable for functions
 * where you need the return value.
 *
 * Some calls *will* be dropped in a throttling scenario. When the target
 * function is eventually called, it will be called with the most recent
 * arguments. This fits with a user input scenario where you don't care about
 * intermediate values, i.e. the "f", "fr", "fre" on the way to "fred" .
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  period: number,
): (...args: Parameters<T>) => void {
  let startAt = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - startAt > period) {
      startAt = now;
    }
    const delay = startAt + period - now;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
      startAt = Date.now();
    }, delay);
  };
}

/**
 * Get an item from an array by its id
 * @param items the array to search
 * @param id the id of the item to find
 * @returns the item, or undefined if not found
 */
export function getById<T extends { id: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

/**
 * Get an item from an array by its id, throwing if not found
 * @param items the array to search
 * @param id the id of the item to find
 * @returns the item
 * @throws if not found
 */
export function getByIdOrThrow<T extends { id: string }>(
  items: T[],
  id: string,
): T {
  const item = getById(items, id);
  if (!item) {
    throw new Error(`Could not find item with id ${id}`);
  }
  return item;
}
