# @lumphammer/shared-fvtt-bits

Common parts to be used across Foundry VTT modules and systems

- [@lumphammer/shared-fvtt-bits](#lumphammershared-fvtt-bits)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Tour Guide](#tour-guide)
  - [Architectural Notes](#architectural-notes)
    - [Getting to git-subrepo](#getting-to-git-subrepo)
    - [About pnpm](#about-pnpm)
    - [pnpm workspaces](#pnpm-workspaces)
  - [Adding dependencies](#adding-dependencies)
  - [Troubleshooting](#troubleshooting)
    - [Checklist (_try these first_)](#checklist-try-these-first)
    - [`fatal: Not a valid object name: ''.`](#fatal-not-a-valid-object-name-)
    - [Huge long list of type errors](#huge-long-list-of-type-errors)

## Prerequisites

- [`git-subrepo`](https://github.com/ingydotnet/git-subrepo). ([Installation instructions](https://github.com/ingydotnet/git-subrepo?tab=readme-ov-file#installation)).
- [`pnpm`](https://pnpm.io/).

## Installation

**Create** the subrepo:

```sh
git subrepo clone git@github.com:n3dst4/shared-fvtt-bits.git packages/shared-fvtt-bits
```

**Copy** everything from `packages/shared-fvtt-bits/dotfiles/copy` into your project. Rename anything that begins or ends with a `!` to remove the `!`.

**Link** everything from `packages/shared-fvtt-bits/dotfiles/link` into your project.

**Install** the package into your project:

```sh
pnpm add @lumphammer/shared-fvtt-bits --workspace
```

## Tour Guide

This repo a a stash for anything that might be useful to shared between FVTT projects.

`src` is for shared code that will be incorporated into your project.

`task-core` is the barely-there task runner framework I threw together to get away from Gulp, Grunt, etc.

`dotfiles` is for tool configs that can be usefully shared between projects.

## Architectural Notes

So, we use git-subrepo + pnpm workspaces. What else could we have used or was considered along the way?

### Getting to git-subrepo

I knew we wanted some kind of shared code between projects. The standard answer in most corporate settings these days would be a monorepo: you put all your code into one repo and then sharing is easy. At the time I wasn't a fan of monorepos due to some bad experiences with monolithic corporate monorepos, but, as it turns out, a monorepo wouldn't be a great fit here because we're going to be sharing code between repos owned by different people (although I am now using pnpm workspaces within a project to install the shared code).

Git submodules were right out - they have many well-documented issues. `git submodule` is just widely considered to be a mistake, and even its own docs recommend using `subtree`.

So my first attempt used [git subtree](https://www.atlassian.com/git/tutorials/git-subtree). There are many better source of documentation on issues with subtree, but the one that broke me very quickly was the timeline clutter. There is the option to "squash" with subtree pushes and pulls, but you're still left with:

- Noise in the git timeline. Even if you `squash` you're still seeing extra parallel lines in your graph view.
- A fragile experience (you have to `subtree pull` every time you `subtree push` or you get errors and have to `subtree split --rejoin` - and even then there are still scenarios that can break you.)
- An awkward UX (it's fiddly enough that you'll want to boil it out into a script or something.)
- No indication to contributors that the shared folder is shared. I "solved" this by putting my subtree in a folder called "subtrees".

Git subrepo seems to be much nicer in every respect except that it needs to to be installed (it doesn't ship with git.) The counterpoint to that is that only the maintainer (person who wants to add/push/pull subrepos) needs to have it installed; regular contributors can just clone your main project repo and they will have access to all the files.

Admittedly there have been some issues with it, mainly phantom errors when doing a `git subrepo push` - but those can be bypassed with `git subrepo push --squash`.

### About pnpm

I use [pnpm](https://pnpm.io/) for dependency management. I like it because it's fast, uses PnP, and it makes me feel slightly hipster for not using npm or yarn. Plus yarn has just always been irritatingly smug.

(As a side note, I'm also super excited about [bun](https://bun.sh/) for dependency management and a bunch of other things, but as of right now (2024-03)it's not ready for primetime.)

Technically, pnpm is just one package manager. You could use another package manager for your own project, and still use this package, but you'll need to work out the details for yourself in that case.

My intent is to use pnpm for dependency management everywhere. There is a checked-in pnpm-lock.yaml file, for example.

`npm` and `yarn` can both handle workspace setups these days, but `pnpm` is what I'm using.

### pnpm workspaces

Early attempts, around the git subtree era, used pnpm's file: protocol to link the shared code into the project. This worked, but had a a major issue that newly created files would not be visible until you did a `pnpm install`.

Eventually I realized that monorepos, aka workspaces in pnpm-speak, can be good, actually. Tbh I don't use the term monorepo much, because I think it's ambiguous whether you mean a single project with multiple packages, or a single repo with your whole universe inside it.

## Adding dependencies

If you add a dependency to this project, think hard about whether it should be a peer dependency. Libraries which should be shared with the main project should be peer dependencies.

If it's a peer dep, add it like:

```sh
pnpm add --save-peer foo
```

If it's not a peer dep, add it as normal like:

```sh
pnpm add foo
```

## Troubleshooting

### Checklist (_try these first_)

- Is `foundryconfig.json` pointing to the right foundry instance?
- `pnpm i`
- `pnpm run build`
- Restart foundry (e.g. `pm2 reload foundry-v12`)

### `fatal: Not a valid object name: ''.`

Problem:

```
$ git subrepo pull shared-fvtt-bits
git-subrepo: Command failed: 'git branch subrepo/shared-fvtt-bits '.
fatal: Not a valid object name: ''.
```

Cause:

You've rebase a commit that was created by `git subrepo push`. When you push or pull a subrepo, it records the parent commit SHA in the subrepo `.gitrrepo` file. If you rebase that commit, that SHA will be a DAMNED LIE.

Fix:

Look at your git history. If you still have a record of the pre-rebase commit, you can look at its **parent** and you will see it has the commit SHA that's currently in the .gitrepo file under `parent`.

Find the equivalent commit in the rebased branch (i.e. the commit before the `.gitrepo` file got modified), copy out its SHA, and paste that into the `.gitrepo` file under `parent`. Commit that, and then try `git subrepo pull/push` again.

Link:

https://github.com/ingydotnet/git-subrepo/issues/503

Prevention:

When a branch contains subrepo push/pull commits, avoid rebasing it. Try to just merge with the parent branch. Less than ideal but will save you from this.

### Huge long list of type errors

Problem:

```
Subsequent property declarations must have the same type.  Property 'use' must
be of type 'SVGProps<SVGUseElement>', but here has type 'SVGProps<SVG
UseElement>'.
```

Cause:

The key is not notice that the conflict looks really weird - `SVGProps<SVGUseElement>`, does not match `SVGProps<SVGUseElement>`?

What's happening is that you're accidentally importing the same type from different files. If you use `shared-fvtt-bits` correctly, you will always import it into your main project as `@lumphammer/shared-fvtt-bits`. This will cause the resolver to find the version that pnpm has hard-linked into your `node_modules` folder. This version overrides the `node_modules` folder within `shared-fvtt-bits`.

As a side note, no amount of `tsconfig` tweaking can fix this. You are literally reaching down into the filesystem and the resolver is just doing its job - finding the closest neighbouring `node_modules` and resolving from there.

Fix:

Somewhere, you have done a direct import from the `shared-fvtt-bits` folder instead of referring to the package.

Wrong:

```ts
import { makeDummyAppV2 } from "../shared-fvtt-bits/src/DummyAppV2";
```

Right:

```ts
import { makeDummyAppV2 } from "@lumphammer/shared-fvtt-bits/src/DummyAppV2";
```

Prevention:

Always always always use `@lumphammer/shared-fvtt-bits` instead of `../../shared-fvtt-bits` in your TS code.
