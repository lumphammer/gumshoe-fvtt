/* eslint-disable quotes */
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createDirection } from "../createDirection";
import { Link } from "./Link";
import { Route } from "./Route";
import { Router } from "./Router";

const d1 = createDirection("d1");
const d2 = createDirection("d2");

const user = userEvent.setup();

describe("Outside of Router", () => {
  it("throws", () => {
    expect(() =>
      render(<Link to={d1()}>Example</Link>),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: useNavigationContext must be used within a Router]`,
    );
  });
});

it("renders a link", () => {
  const { getByText } = render(
    <Router>
      <Link to={d1()}>Example</Link>
    </Router>,
  );
  expect(getByText("Example", { selector: "a" })).toBeInTheDocument();
});

describe("navigate from route", () => {
  it("from is not a parent", () => {
    expect(() =>
      render(
        <Router>
          <Link from={d2} to={d1()}>
            Example
          </Link>
        </Router>,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Link has "from" set to d2 but the current step is not a descendant of that step]`,
    );
  });

  describe("one level", () => {
    it("no from", async () => {
      const { getByText, container } = render(
        <Router>
          <Link to={d1()}>[d1]</Link>
          <Route direction={d1}>d1</Route>
        </Router>,
      );
      expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
      await user.click(getByText("[d1]"));
      expect(container.innerText).toMatchInlineSnapshot('"[d1]d1"');
    });

    it("from=here", async () => {
      const { getByText, container } = render(
        <Router>
          <Link from="here" to={d1()}>
            [d1]
          </Link>
          <Route direction={d1}>d1</Route>
        </Router>,
      );
      expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
      await user.click(getByText("[d1]"));
      expect(container.innerText).toMatchInlineSnapshot('"[d1]d1"');
    });

    it("from=root", async () => {
      const { getByText, container } = render(
        <Router>
          <Link from="root" to={d1()}>
            [d1]
          </Link>
          <Route direction={d1}>d1</Route>
        </Router>,
      );
      expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
      await user.click(getByText("[d1]"));
      expect(container.innerText).toMatchInlineSnapshot('"[d1]d1"');
    });
  });

  it("to is an array of one step", async () => {
    const { getByText, container } = render(
      <Router>
        <Link to={[d1()]}>[d1]</Link>
        <Route direction={d1}>d1</Route>
      </Router>,
    );
    expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
    await user.click(getByText("[d1]"));
    expect(container.innerText).toMatchInlineSnapshot('"[d1]d1"');
  });

  it("to is an array of two steps", async () => {
    const { getByText, container } = render(
      <Router>
        <Link to={[d1(), d2()]}>[d1, d2]</Link>
        <Route direction={d1}>
          d1
          <Route direction={d2}>d2</Route>
        </Route>
      </Router>,
    );
    expect(container.innerText).toMatchInlineSnapshot('"[d1, d2]"');
    await user.click(getByText("[d1, d2]"));
    expect(container.innerText).toMatchInlineSnapshot('"[d1, d2]d1d2"');
  });
});

describe("from a child route", () => {
  it("no from", async () => {
    const { getByText, container } = render(
      <Router>
        <Link to={d1()}>[d1]</Link>
        <Route direction={d1}>
          d1
          <Link to={d2()}>[d2]</Link>
          <Route direction={d2}>d2</Route>
        </Route>
      </Router>,
    );
    expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
    await user.click(getByText("[d1]"));
    await user.click(getByText("[d2]"));
    expect(container.innerText).toMatchInlineSnapshot('"[d1]d1[d2]d2"');
  });
  it("from=here", async () => {
    const { getByText, container } = render(
      <Router>
        <Link from="here" to={d1()}>
          [d1]
        </Link>
        <Route direction={d1}>
          d1
          <Link from="here" to={d2()}>
            [d2]
          </Link>
          <Route direction={d2}>d2</Route>
        </Route>
      </Router>,
    );
    expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
    await user.click(getByText("[d1]"));
    await user.click(getByText("[d2]"));
    expect(container.innerText).toMatchInlineSnapshot('"[d1]d1[d2]d2"');
  });

  it("from=root to a non-existant route goes nowhere", async () => {
    const { getByText, container } = render(
      <Router>
        <Link to={d1()}>[d1]</Link>
        <Route direction={d1}>
          d1
          <Link from="root" to={d2()}>
            [d2]
          </Link>
          <Route direction={d2}>d2</Route>
        </Route>
      </Router>,
    );
    expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
    await user.click(getByText("[d1]"));
    await user.click(getByText("[d2]"));
    expect(container.innerText).toMatchInlineSnapshot('"[d1]"');
  });
});
