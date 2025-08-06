import "@testing-library/jest-dom/vitest";

import { getByTestId, getByText, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { Link } from "./Link";
import { Route } from "./Route";
import { Router } from "./Router";
import { App, direction1 } from "./testItems";

const user = userEvent.setup();

describe("Empty", () => {
  test("should render nothing", () => {
    const { container } = render(<Router />);
    expect(container.innerHTML).toBe("");
    expect(true).toBe(true);
  });
});

describe("root content", () => {
  test("should render content", () => {
    const { container } = render(
      <Router>
        <p>root</p>
      </Router>,
    );
    expect(container.innerHTML).toContain("root");
  });
});

describe("single route", () => {
  test("should not show content immediately", () => {
    const { container } = render(
      <Router>
        <Route direction={direction1}>
          <p>route</p>
        </Route>
      </Router>,
    );
    expect(container.innerHTML).not.toContain("route");
  });

  test("should show content when a link is clicked", async () => {
    const { container } = render(
      <Router>
        <Link data-testid="link" from="root" to={direction1()} />
        <Route direction={direction1}>
          <p>route</p>
        </Route>
      </Router>,
    );
    expect(container.innerHTML).not.toContain("route");
    const link = container.querySelector("a[data-testid=link]");

    expect(link).not.toBeNull();

    await user.click(link!);
    expect(container.innerHTML).toContain("route");
  });
});

test("navigation story", async () => {
  // 1 render the router
  const { container } = render(<App />);
  expect(container).toMatchSnapshot("001 initial state");
  expect(getByText(container, "Terrific company website")).toBeInTheDocument();
  expect(getByText(container, "About", { selector: "a" })).toBeInTheDocument();
  expect(
    getByText(container, "Contact", { selector: "a" }),
  ).toBeInTheDocument();
  expect(getByText(container, "Values", { selector: "a" })).toBeInTheDocument();

  // 2 visit the about page
  await user.click(getByText(container, "About", { selector: "a" }));
  expect(container).toMatchSnapshot("002 about page");
  const aboutPage = getByTestId(container, "about-page");
  const innerValuesLink = getByText(aboutPage, "Values", { selector: "a" });
  getByText(container, "Team", { selector: "a" });

  // 3 visit the values page
  await user.click(innerValuesLink);
  expect(container).toMatchSnapshot("003 values page");
  const valuesPage = getByTestId(container, "values-page");
  expect(container).toHaveTextContent("Our values are important to our team");
  // expect(getByText("Team", { selector: "a" })).toBeInTheDocument();
  const valuesLinkToTeam = getByText(valuesPage, "team", { selector: "a" });

  // 4 go sideways to team
  await user.click(valuesLinkToTeam);
  expect(container).toMatchSnapshot("004 team page");
  expect(container).toHaveTextContent("Our team is great");
  expect(container).not.toHaveTextContent(
    "Our values are important to our team",
  );
  const teamPage = getByTestId(container, "team-page");

  // 5 go to Members' pages
  await user.click(getByText(teamPage, "Alice", { selector: "a" }));
  expect(container).toMatchSnapshot("005 alice page");
  expect(container).toHaveTextContent("Alice is a member of our team");
  await user.click(getByText(teamPage, "Bob", { selector: "a" }));
  expect(container).toHaveTextContent("Bob is a member of our team");
  expect(container).not.toHaveTextContent("Alice is a member of our team");
  await user.click(getByText(teamPage, "Carla", { selector: "a" }));
  expect(container).toHaveTextContent("Carla is a member of our team");
  expect(container).not.toHaveTextContent("Alice is a member of our team");
  expect(container).not.toHaveTextContent("Bob is a member of our team");

  // 6 go home
  await user.click(getByText(teamPage, "Home", { selector: "a" }));
  expect(container).toMatchSnapshot("006 home page");
  expect(container).not.toHaveTextContent("Our team is great");
  expect(container).not.toHaveTextContent("Learn more about our");
  expect(container).not.toHaveTextContent("Alice is a member of our team");
  expect(container).not.toHaveTextContent("Bob is a member of our team");
  expect(container).not.toHaveTextContent("Carla is a member of our team");

  // 7 go to contact
  await user.click(getByText(container, "Contact", { selector: "a" }));
  expect(container).toMatchSnapshot("007 contact page");
  expect(container).toHaveTextContent("Contact us");
  expect(container).not.toHaveTextContent("foo@example.com");
  expect(container).not.toHaveTextContent("01234 567890");
  expect(container).not.toHaveTextContent("@wobble on Wibble");
  const contactPage = getByTestId(container, "contact-page");
  await user.click(getByText(contactPage, "Email us", { selector: "a" }));
  expect(container).toHaveTextContent("foo@example.com");
  expect(container).not.toHaveTextContent("01234 567890");
  expect(container).not.toHaveTextContent("@wobble on Wibble");
  await user.click(getByText(contactPage, "Phone us", { selector: "a" }));
  expect(container).not.toHaveTextContent("foo@example.com");
  expect(container).toHaveTextContent("01234 567890");
  expect(container).not.toHaveTextContent("@wobble on Wibble");
  await user.click(getByText(contactPage, "Social media", { selector: "a" }));
  expect(container).toHaveTextContent("@wobble on Wibble");
  expect(container).not.toHaveTextContent("foo@example.com");
  expect(container).not.toHaveTextContent("01234 567890");

  // 8 go to categories
  await user.click(
    getByText(container, "Product Categories", { selector: "a" }),
  );
  expect(container).not.toHaveTextContent("Contact us");
  const categoriesPage = getByTestId(container, "categories-page");
  expect(categoriesPage).toHaveTextContent("Categories");
  await user.click(getByText(categoriesPage, "Category 1", { selector: "a" }));
  const category1Page = getByTestId(container, "category-1-page");
  expect(category1Page).toHaveTextContent("Category 1");
  await user.click(
    getByText(category1Page, "Product 1 in beige", { selector: "a" }),
  );
  expect(container).toHaveTextContent("This is product 1 in beige");
  expect(container).not.toHaveTextContent("This is product 1 in blue");
  await user.click(
    getByText(category1Page, "Product 1 in blue", { selector: "a" }),
  );
  expect(container).toHaveTextContent("This is product 1 in blue");
  expect(container).not.toHaveTextContent("This is product 1 in beige");
});
