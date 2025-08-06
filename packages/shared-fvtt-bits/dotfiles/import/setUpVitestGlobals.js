import "@testing-library/jest-dom/vitest";

import { afterEach, vi } from "vitest";

const noop = () => undefined;

export function setUpVitestGlobals() {
  global.Hooks = {
    once: noop,
    on: noop,
  };

  // see https://github.com/testing-library/react-testing-library/issues/1197
  // and https://github.com/testing-library/user-event/issues/1115
  global.jest = {
    advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  };

  // see https://testing-library.com/docs/react-testing-library/api/#cleanup
  global.afterEach = afterEach;
}
