import { vi } from "vitest";

export const epoch = 0;

export function getAdditiveStates(count: number): string[] {
  if (count < 1 || count > 26) {
    throw new Error("count must be between 1 and 26");
  }
  const result: string[] = [];
  // loop over the indices of the final array
  for (let i = 0; i < count; i++) {
    const state = Array.from({ length: i + 1 }, (_, i) =>
      String.fromCharCode(i + 97),
    );
    result.push(state.join(""));
  }
  return result;
}

export function advanceTime10s(): void {
  vi.setSystemTime(new Date().setSeconds(new Date().getSeconds() + 10));
}
