# Minirouter

## TL;DR

**Minirouter** is a router for React. It works **in-memory only**, **cannot interact with the browser history**, and **does not use string-based URIs**. It offers **partial type safety**, uses **TSX for routing**, and is designed to be used in situation where you are creating a routable UI as a smaller piece of a larger application.

## Design

Two core concepts are Directions and Steps.

**Directions** are an identifier for the types of way a user can navigate your app. On its own, a Direction does not specify any content. A Direction means "this is a way that the user could potentially navigate."

**Steps** are a concrete navigational decision. A Step consists of a Direction and a set of parameters, if any, needed to fulfil that Direction.

The current state of a router is just a list of Steps. This is analogous to how the href in a traditional router is just a list of path segments joined with slashes.

The key React components are `Router`, `Link`, and `Route`.

`Router` is the top-level component. Any time you want to have some routed content, you wrap it in a `Router` at the top level.

`Link` is a component that you can use to create a clickable link that will navigate the user to a particular step. You give it a "to" prop, which is a Step.

`Route` is a component that you can use to specify the content that should be rendered when a Step with a particular Direction is active. You give it a "direction" prop, which is a Direction, or the string "root" or "up".

We also have various hooks, but we'll get to them later.

## The Basics

A Direction is an identifier for the types of way a user can navigate your app. You create a Direction by calling `createDirection` and passing it a description. The description is purely for debugging and errors, and is not otherwise used by the router.

```ts
const about = createDirection("about");
const contact = createDirection("contact");
```

Notice that a direction doesn't specify any content. That's because it's just a free value. It is not mounted into a router (yet).

Here's where we win some type safety. You can specify the parameter types of the directions, and the router will enforce that.

```ts
const values = createDirection<{ id: string }>("product");
```

Okay, so how do we use the directions?

First, you need to mount a `Router` somewhere high up in your app. This is the root of the router tree.

You can render anything you like in the router, but the magic comes in when you render a `Route` component.

```tsx
<Router>
  <h1>Terrific company website</h1>
  <Route direction={about}>
    <About />
  </Route>
  <Route direction={contact}>
    <Contact />
  </Route>
</Router>
```

The `Route` component takes a `direction` prop, and renders its children when the user navigates to that direction.

So how do we navigate? You can use the `Link` component to create navigation links:

```tsx
<Router>
  <h1>Terrific company website</h1>
  <p>
    <Link to={about()}>About</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <Route direction={about}>
    <About />
  </Route>
  <Route direction={contact}>
    <Contact />
  </Route>
</Router>
```

Note that the `to` prop of the `Link` component is a `Step`, not a `Direction`. You can tell because we _call_ the direction rather than pass it directly. That how we create a step from a direction.

Why this extra calling step? So that we can have directions that require _parameters_. Look at this:

```tsx
const product = createDirection<{ id: string }>("product");

<Router>
  <h1>Our products</h1>
  <p>
    <Link to={product({ id: "foo" })}>Foo</Link>
    <Link to={product({ id: "bar" })}>Bar</Link>
  </p>

  <Route direction={product}>
    <Product />
  </Route>
</Router>;
```

The `product` direction takes a parameter, and the `Product` component can use that parameter to render the product. In the example, the type of the parameter is `{id: string}`, but you can pass any type you want. We could have just used `string` here, and then we would call it like `product("foo")` instead of `product({id: "foo"})`.

Here's what it looks like in the `Product` component:

```tsx
const Product: React.FC = () => {
  const { id } = useParams(product);
  return (
    <div>
      <h1>Product {id}</h1>
      <p>This is a product</p>
    </div>
  );
};
```

`useParams` is a hook that lets you get the parameters from the current step or any parent step. It returns correctly typed results because we know the the parameter type we passed to the direction.

So far we've only seen one level of routing. But we can go deeper. You can nest routes inside routes, either directly or indirectly. Here's an example of a nested route:

```tsx
const team = createDirection("team");
const member = createDirection<string>("member");

<Router>
  <h1>Our Company</h1>
  <p>
    <Link to={about()}>About</Link>
    <Link to={contact()}>Contact</Link>
    <Link to={team()}>Team</Link>
  </p>

  <Route direction={team}>
    <h2>The Team</h2>
    <ul>
      <li>
        <Link to={member("alice")}>Alice</Link>
      </li>
      <li>
        <Link to={member("bob"})>Bob</Link>
      </li>
      <li>
        <Link to={member("carol")}>Carol</Link>
      </li>
    </ul>
    <Route direction={member}>
      <Member />
    </Route>
    {/* all the other routes */}
  </Route>
</Router>
```

In this example, we're nesting the "member" route inside the "team" route.

We could put the "Team" page in its own component like this:

```tsx
// directions.ts
const team = createDirection("team");
const member = createDirection<string>("member");

// App.tsx
const App = () => {
  return(
    <Router>
      <h1>Our Company</h1>
      <p>
        <Link to={about()}>About</Link>
        <Link to={contact()}>Contact</Link>
        <Link to={team()}>Team</Link>
      </p>

      <Route direction={team}>
        <Team />
      </Route>
      {/* all the other routes */}
    </Router>
  );
};

//Team.tsx
export const Team: React.FC = () => {
  return (
    <>
      <h2>The Team</h2>
      <ul>
        <li>
          <Link to={member("alice")}>Alice</Link>
        </li>
        <li>
          <Link to={member("bob"})>Bob</Link>
        </li>
        <li>
          <Link to={member("carol")}>Carol</Link>
        </li>
      </ul>
      <Route direction={member}>
        <Member />
      </Route>
    </>
  );
};
```

### Deep linking

The `to` prop of `Link` can also take an array of steps...

```tsx
const team = createDirection("team");
const member = createDirection<string>("member");

<Router>
  <h1>Our Company</h1>
  <p>
    <Link to={[team(), member("alice")]}>Alice</Link>
    <Link to={[team(), member("bob")]}>Bob</Link>
    <Link to={[team(), member("carol")]}>Carol</Link>
  </p>

  <Route direction={team}>
    <h2>The Team</h2>
    <Route direction={member}>
      <Member />
    </Route>
  </Route>
</Router>;
```

### Linking from somewhere higher up the router

`Link` can also take a `from` prop, which lets you link to a step from a higher up the router. The value of `from` can be either a `Direction` or the string "root", or the string "here".

"here" means "the current step". This is the default. I'm not going to type out an example, it's how every other example above works.

"root" means "the root of the router" - in other words, whatever is given as the "to" prop will become the entire path.

```tsx
<Router>
  <h1>Our Company</h1>
  <p>
    <Link to={products()}>Products</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <Route direction={products}>
    <h2>Our products</h2>
    We are a great company. You can
    <Link from="root" to={contact()}>
      contact us here
    </Link>
    .
  </Route>
  <Route direction={contact}>
    <h2>Contact</h2>
    Contact details blah blah
    <Link from="root">Go home</Link>
  </Route>
</Router>
```

Note that in this example the "to" prop is optional - that's equivalent of `to={[]}`, in other words, "don't go anywhere down from the `down` prop."

Otherwise if `from` is a `Direction`, it means "go to the parent step of the current step that matches that direction". If there is no parent step that matches the direction, an error will be thrown.

```tsx
<Router>
  <h1>Our Company</h1>
  <p>
    <Link to={products()}>Products</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <Route direction={products}>
    <h2>Our products</h2>
    <Link to={widget}>Widget</Link>
    <Link to={geegaw}>Geegaw</Link>

    <Route direction={widget}>
      <h2>Widget</h2>
      The widget is blah blah.
    </Route>
    <Route direction={geegaw}>
      <h2>Geegaw</h2>
      The Geegaw goes great with a
      <Link from={products} to={thingy()}>
        Thingy
      </Link>
      .
    </Route>
  </Route>
</Router>
```

### Going up one level

There's one other linking trick. `to` can be the string "up". This means "go up one level".

```tsx
<Router>
  <h1>Our Company</h1>
  <p>
    <Link to={team()}>Team</Link>
    <Link to={member("alice")}>Alice</Link>
    <Link to={member("bob")}>Bob</Link>
    <Link to={member("carol")}>Carol</Link>
  </p>

  <Route direction={team}>
    <h2>The Team</h2>
    <Link to={member("alice")}>Alice</Link>
    <Link to={member("bob")}>Bob</Link>
    <Link to={member("carol")}>Carol</Link>
    <Route direction={member}>
      <Member />
    </Route>
  </Route>
</Router>

const Member: React.FC = () => {
  const {id} = useParams(member);
  return (
    <div>
      <h2>{id}</h2>
      <Link to="up">back to team</Link>
    </div>
  );
```

## Animation and Outlets

Minirouter does not provide a complete system for animating route transitions, but we offer two tools to help you roll your own (`useRoute` and `useOutletProvider`), and two prebuilt examples using them.

### useRoute

The first tool is, instead of using the `Route` component, you can roll your own route component using the `useRoute` hook. You pass it a `direction` and `children`, and it returns some renderable content, which will be `null` until the route is active.

The best example of how it works is the `Route` component itself, which is just:

```tsx
export const Route: React.FC<PropsWithChildrenAndDirection> = ({
  direction,
  children,
}) => {
  const result = useRoute({ direction, children });
  return result;
};
```

How does this help with animating? Well, now you can take control of hiding and showing content however you like. For example, we provide a component called `SlideInRoute` which uses [Framer Motion](https://www.framer.com/motion/) to swish route content in from the right and swish it back out again when you leave. This is just one example of how you can use the `useRoute` hook to control the content of your routes.

```tsx
export const SlideInRoute = memo<PropsWithChildrenAndDirection>(
  ({ children, direction }) => {
    const result = useRoute({ direction, children });
    const { currentStep } = useNavigationContext();
    return (
      <div
        css={{ ...absoluteCover, overflow: "hidden", pointerEvents: "none" }}
      >
        <AnimatePresence mode="wait">
          {result && currentStep && (
            <motion.div
              key={currentStep.id}
              // ...other framer motion props to create the animation...
            >
              {result}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
```

See how it uses the `useNavigationContext` hook to get the `id` of the current step, and then uses it as the `key` for the `motion.div` so that Framer Motion can see when new content has been added. It needs that `key` to tell the difference between steps.

Here's a real-world example (ish):

```tsx
const cardsDetailsDirection = createDirection<number>("cardsDetails");

<SlideInRoute direction={cardsDetailsDirection}>
  <CardDetails />
</SlideInRoute>;
```

Every time the user navigates to a new card, the active step changes, and therefore the `currentStep.id` changes, and Framer Motion knows to animate the new content in and the old content out.

### useOutletProvider

There's a limitation to the `useRoute` approach. Consider this:

```tsx
const about = createDirection("about");
const contact = createDirection("contact");

<Router>
  <h1>Terrific company website</h1>
  <p>
    <Link to={about()}>About</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <SlideInRoute direction={about}>
    <About />
  </SlideInRoute>
  <SlideInRoute direction={contact}>
    <Contact />
  </SlideInRoute>
</Router>;
```

In this example, the `About` and `Contact` components are rendered when the user navigates to the "about" or "contact" steps. It works! Ish. But there's a problem.

In `SlideInRoute` we have this line:

```tsx
<AnimatePresence mode="wait">
```

That `mode="wait"` tells Framer Motion to orchestrate the animations so that new content does not enter until the old content has exited. That works fine in the `CardDetails` example above because there's one one instance of `AnimatePresence`, and it's just animating between steps with different params.

But in our new example, we now have _two_ `AnimatePresence` components, one for the `About` and one for the `Contact`. That means that there's no way to orchestrate the transitions between the two.

Step in `useOutletProvider`. Conceptually, `useOutletProvider` takes your regular JSX children, and returns two things:

- Some `content`, which is just something you can render wherever you want. It shouldn't create any on-screen content as long as your `children` only contains `Route`s.
- A `registry` which is a map of string ids to routed content. This map will contain one entry for each child `Route` that is active.

You can use the content in the `registry` to render the active content and the ids to differentiate between children for purposes of orchestrating transitions.

The most basic example of `useOutletProvider` is this:

```tsx
export const Outlet = memo<PropsWithChildren>(({ children }) => {
  const { content, registry } = useOutletProvider(children);
  return (
    <>
      {Object.entries(registry).map(([id, content]) => (
        <Fragment key={id}>{content}</Fragment>
      ))}
      {content}
    </>
  );
});
```

You'd use it like this:

```tsx
const about = createDirection("about");
const contact = createDirection("contact");

<Router>
  <h1>Terrific company website</h1>
  <p>
    <Link to={about()}>About</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <Outlet>
    <Route direction={about}>
      <About />
    </Route>
    <Route direction={contact}>
      <Contact />
    </Route>
  </Outlet>
</Router>;
```

_The end result of this example works exactly the same as before, when we just had bare routes without an `Outlet`_ The only difference is that under the hood, instead of each route rendering its own content, they're reporting up the to the `Outlet` component, which is responsible for rendering the active content.

So what's the point? The point is that you're not meant to use `Outlet`, it's just a minimal example of how you can use the `useOutletProvider` hook.

A more complete example of `useOutletProvider` is this:

```tsx
export const SlideInOutlet = memo<PropsWithChildren>(({ children }) => {
  const { content, registry } = useOutletProvider(children);
  return (
    <div
      css={{
        ...absoluteCover,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        {Object.entries(registry)
          .filter(([_, content]) => content !== null)

          .map(([id, content]) => (
            <motion.div
              key={id}
              // ...other framer motion props to create the animation...
            >
              {content}
            </motion.div>
          ))}
      </AnimatePresence>

      {content}
    </div>
  );
});
```

This just like our `SlideInRoute` frome above, but now we can orchestrate between content from different routes!

You's use it like this:

````tsx
```tsx
const about = createDirection("about");
const contact = createDirection("contact");

<Router>
  <h1>Terrific company website</h1>
  <p>
    <Link to={about()}>About</Link>
    <Link to={contact()}>Contact</Link>
  </p>

  <SlideInOutlet>
    <Route direction={about}>
      <About />
    </Route>
    <Route direction={contact}>
      <Contact />
    </Route>
  </SlideInOutlet>
</Router>
````

Now, the "about" and "contact" will animate in and out as you navigate between them, and crucially, they will wait for the previous one to clear before coming in.

#### Caveat

There are two caveats to this approach.

One, you _must_ render the `content` that you get from the `useOutletProvider` hook. If you don't, nothing will happen.

Two, if you put anything inside the `Outlet` that isn't a `Route`, it will get rendered as part of said `content`. That probably isn't what you want. So the rule is: _**only put `Route`s inside an `Outlet`**_.

## Background and motivation

I'm writing systems and modules for [Foundry VTT](https://foundryvtt.com/). In that context, my code gets to run in something called an "App", which is a little window inside the main FVTT UI.

As my main system, [INVESTIGATOR](https://gitlab.com/n3dst4/investigator) grows, I've used various patterns to represent various types of "nesting" in the UI.

For example, there's a "TabContainer" component that works much like you might expect. It's been in there forever. We also have a simple "list of strings" editor, but it's also been expanded to cope with "list of string and something else". The resulting UI is... acceptable UX. 7/10.

It gets worse in the Settings UI. INVESTIGATOR is a very configurable system, by design - the whole idea is that you can jerry-rig it to run almost any GUMSHOE-style system you want. Early on this means some checkboxes, some list editors, and some text fields. But when I added configurable PC Stats, I now had a need to be able to edit a list of non-trivial objects. The UI pattern I chose was was a cramped list of mini-forms, each with a dropdown menu for various operations. It's usable, but ugly... 6/10.

When I added equipment categories, hoo boy. There's a list of categories, each with a bunch of editable fields. And then each category has a list of fields that will exist on all equipment in said category. So now we have list of mini-forms, each of which also contains a sub-list of even more mini-forms. It's a disgrace. 3/10. Only saved from a worse score because it's actually pretty quick to use.

There's also the issue that the settings app uses the tab container, but as the system grows, we are going to run out of space for tabs. It just about works right now with the latest addition, "Cards", but in other languages i.e. German where the word for card is "Kaartengefinkelschaft" [^1] we're going to have an issue.

[^1]: It is not. But you get the idea.

So I've been thinking for a while that when we need is a more open design where we treat the FVTT App more like a mobile device, and work by navigating around a tree of views. I had a picture in my head of panels sliding in from the right, leaving a slice of the parent panel visible. You see this kind of UI in lots of places.

It felt like a very natural fit for some kind of router. My thought experiment was, if I don't use a router, I'm going to have to write something to manage the state, deal with navigating... in other words a router.

So Attempt #1 was based on [Tanstack Router](https://tanstack.com/router/v2/docs/overview). It's a very cool project, but it's really designed to do one thing, and that is to manage the state of a single page app or a server-rendered app. It's the only router out there that offers full type safety, but it does that by have a global type which defines the shape of your routes. In my situation, I want to be able to mount several separate routers in different places and not have them all defined in one monolith.

So Attempt #2 was based on [React Router](https://reactrouter.com/). It's the granddaddy of routers in React, but it keeps evolving. v6 doesn't quite offer the level of safety that TSR does, but it too is moving to a "define everything in one place" approach.

The weirdly hard thing with TSR and RRD is that it's super hard to get routing information about the level of the route tree that you're rendering at. I.e. you can get the whole current path, but if you're rendering a page that's halfway down the tree, it's really hard to say "okay, but where am _I_? In fact RRD only allows you to do this if you accept the "define all your routes in one place" approach.

I really, really want to be able to define child routes inside parent routes. I am willing to sacrifice 100% type safety for that. I also really like defining routes in TSX rather than a big old config object.

So I ended up writing a router anyway. It's called "minirouter".

This router cannot interact with the browser history in any way. It's like the `MemoryHistory` that both TSR and RRD provide. That's because for my use case, I do not have meaningful access to the URL, and also I'll need multiple routers in different places,so they need independent state.

It also does not use string-based URLs. Because I'm not adding URLs to the browser history, I can use any structure I want as the "path". This lets me claw back an element of type safety.
