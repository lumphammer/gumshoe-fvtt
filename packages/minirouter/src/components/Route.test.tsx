import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Route } from "./Route";
import { Router } from "./Router";
import { direction1 } from "./testItems";

describe("Outside of Router", () => {
  test("should throw", () => {
    expect(() => render(<Route direction={direction1} />)).toThrow();
  });
});

describe("Empty", () => {
  test("should render nothing", () => {
    const { container } = render(
      <Router>
        <Route direction={direction1} />
      </Router>,
    );
    expect(container.innerHTML).toBe("");
  });
});
