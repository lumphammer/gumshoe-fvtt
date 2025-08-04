import { createDirection } from "../createDirection";
import { Outlet } from "../outlets/Outlet";
import { useParams } from "../useParams";
import { Link } from "./Link";
import { Route } from "./Route";
import { Router } from "./Router";

export const direction1 = createDirection("foo");
export const about = createDirection("about");
export const values = createDirection("values");
export const team = createDirection("team");
export const member = createDirection<string>("member");
export const contact = createDirection("contact");
export const email = createDirection("email");
export const phone = createDirection("phone");
export const social = createDirection("social");
export const categories = createDirection("categories");
export const category = createDirection<number>("category");
export const product = createDirection<{
  id: number;
  variant: string;
}>("product");

const Values = () => (
  <div data-testid="values-page">
    <h2>Values</h2>
    Our values are important to our{" "}
    <Link from={about} to={team()}>
      team
    </Link>
    and you can
    <Link to={contact()}>contact us</Link>
    about them.
  </div>
);

const Product = () => {
  const { id, variant } = useParams(product);
  return (
    <div data-testid={`product-${id}-${variant}-page`}>
      <h2>
        This is product {id} in {variant}
      </h2>
      <Link to="up">back to category</Link>
    </div>
  );
};

Product.displayName = "Product";

const Category = () => {
  const categoryId = useParams(category);
  return (
    <div data-testid={`category-${categoryId}-page`}>
      <h2>Category {categoryId}</h2>
      <Link to="up">back to categories</Link>
      <Link
        from={category}
        to={product({
          id: 1,
          variant: "beige",
        })}
      >
        Product 1 in beige
      </Link>
      <Link
        from={category}
        to={product({
          id: 1,
          variant: "blue",
        })}
      >
        Product 1 in blue
      </Link>
      <Link
        from={category}
        to={product({
          id: 2,
          variant: "red",
        })}
      >
        Product 2 in red
      </Link>
      <Link
        from={category}
        to={product({
          id: 3,
          variant: "yellow",
        })}
      >
        Product 3 in yellow
      </Link>
      <Link
        from={category}
        to={product({
          id: 3,
          variant: "green",
        })}
      >
        Product 3 in green
      </Link>
      <Route direction={product}>
        <Product />
      </Route>
    </div>
  );
};

const Categories = () => (
  <div data-testid="categories-page">
    <h2>Categories</h2>
    <ul>
      <li>
        <Link from={categories} to={category(1)}>
          Category 1
        </Link>
      </li>
      <li>
        <Link from={categories} to={category(2)}>
          Category 2
        </Link>
      </li>
      <li>
        <Link from={categories} to={category(3)}>
          Category 3
        </Link>
      </li>
    </ul>
    <Route direction={category}>
      <Category />
    </Route>
  </div>
);

const Member = () => {
  const name = useParams(member);
  return (
    <div>
      <h2>{name} is a member of our team</h2>
      <Link to="up">back to team</Link>
    </div>
  );
};

const Contact = () => (
  <div data-testid="contact-page">
    <h2>Contact us</h2>
    <Link to={email()}>Email us</Link>
    <Link to={phone()}>Phone us</Link>
    <Link to={social()}>Social media</Link>
    <Outlet>
      <Route direction={email}>
        <div>foo@example.com</div>
      </Route>
      <Route direction={phone}>
        <div>01234 567890</div>
      </Route>
      <Route direction={social}>
        <div>@wobble on Wibble</div>
      </Route>
    </Outlet>
  </div>
);

export const App = () => (
  <Router>
    <h1>Terrific company website</h1>
    {/* top level nav */}
    <Link to={about()}>About</Link>
    <Link from="root" to={contact()}>
      Contact
    </Link>
    <Link to={[about(), values()]}>Values</Link>
    <Link to={[categories()]}>Product Categories</Link>5
    <Route direction={about}>
      <div data-testid="about-page" className="about">
        <h2>About</h2>
        <p>Learn more about our</p>
        <ul>
          <li>
            <Link to={values()}>Values</Link>
          </li>
          <li>
            <Link to={team()}>Team</Link>
          </li>
        </ul>

        <Route direction={values}>
          <Values />
        </Route>

        <Route direction={team}>
          <div data-testid="team-page">
            <h2>Team</h2>
            Our team is great
            <Link to={member("Alice")}>Alice</Link>
            <Link to={member("Bob")}>Bob</Link>
            <Link to={member("Carla")}>Carla</Link>
            <Link from="root" to={[]}>
              Home
            </Link>
          </div>
          <Route direction={member}>
            <Member />
          </Route>
        </Route>
      </div>
    </Route>
    <Route direction={contact}>
      <Contact />
    </Route>
    <Route direction={categories}>
      <Categories />
    </Route>
  </Router>
);
