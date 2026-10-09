# Development notes

- [Development notes](#development-notes)
  - [Contributing \& general hacking](#contributing--general-hacking)
    - [Prerequisites](#prerequisites)
    - [Getting started](#getting-started)
    - [Linting and formatting](#linting-and-formatting)
    - [pnpm](#pnpm)
  - [Migrations](#migrations)
  - [Compendium packs](#compendium-packs)
  - [Translations](#translations)
    - [How to pull translations from Transifex](#how-to-pull-translations-from-transifex)
    - [When someone sends a PR with translation changes](#when-someone-sends-a-pr-with-translation-changes)
    - [Getting set up to pull translations from Transifex](#getting-set-up-to-pull-translations-from-transifex)
  - [Adding document data fields](#adding-document-data-fields)
  - [Adding system settings](#adding-system-settings)
  - [Using the "Developer mode" module](#using-the-developer-mode-module)
  - [Development flow](#development-flow)
  - [Release process](#release-process)
    - [What happens if the CI pipeline fails?](#what-happens-if-the-ci-pipeline-fails)
  - [GitLab Legacy](#gitlab-legacy)
  - [fvtt-types](#fvtt-types)


## Contributing & general hacking

If you'd like to contribute this code, please be aware it uses various modern front-end tools like Vite and React, so some of it will not look like normal Handlebars + JQuery Foundry stuff.

That said, please read on!

These docs were mostly written for my own benefit, so feel free to reach out to me on Discord if you have questions. Head to the [Pelgrane's Virtual Tabletops Discord channel][pelgrane-discord] and ask for `@n3dst4`.


### Prerequisites

* Have [Node.js](https://nodejs.org/) installed.
* Have `pnpm` available. You can do this by running `corepack enable` after you've installed Node.


### Getting started

1. Clone the repo.
2. Copy `foundryconfig_template.json` to `foundryconfig.json` and edit it to fill in
  * `dataPath` is the path to your foundry data folder
  * `url` is the URL of your foundry instance

    Example:
      ```json
      {
        "dataPath": "/home/ndc/foundrydata",
        "url": "http://localhost:30000/"
      }
      ```
3. Run `pnpm install` to install dependencies.
4. Run `pnpm run build` to do a build.
5. Run `pnpm run link` to link it into your foundry data folder.
6. Run `pnpm dev` to start a live dev server (so you don't need to keep running `pnpm run build` after every change.)

Before committing, run `pnpm check`. It runs the typecheck, tests, linter, format check and build, which is what CI does.

There are also browser tests, which drive a real Foundry with Playwright: see [`e2e/README.md`](e2e/README.md).

If you're working with an AI coding agent, see also [`AGENTS.md`](AGENTS.md), which collects the less obvious things about this codebase.


### Linting and formatting

We use [oxlint](https://oxc.rs/docs/guide/usage/linter) and [Prettier](https://prettier.io/) for linting and formatting. You can run these tools with `pnpm run lint:check` and `pnpm run format:check` to check for errors and `pnpm run lint:fix` and `pnpm run format:fix` to fix them.

Even better (and more reliable) is to install a plugin for your editor that will run these tools automatically. For example, for VSCode, you can install the [oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) and [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions. Personally I have my IDE set up to "format on save" so I don't have to think about it.


### pnpm

We use [pnpm](https://pnpm.io/) instead of npm because it's faster and more efficient. It's a drop-in replacement for npm, so you can use it just like npm. If you don't have it installed, you can install it with `corepack enable` (Corepack is a tool for installing package managers. It ships with Node.js, so you should already have it.)

## Migrations

There are two kinds of migration.

**Per-document data shape changes** go in the data model's `static migrateData(source)` (see `WeaponModel` in `src/module/items/weapon.ts` for an example using `migrateValue`). Foundry runs these whenever it loads a document, so they need no bookkeeping, but they don't save the migrated data back.

**One-off migrations which update stored data** are "flagged migrations", in `src/migrations/flaggedMigrations.ts`, grouped by document type (`item`, `actor`, `world`, etc.). Each one runs once per world and is then flagged as complete in the `migrationFlags` setting, so it doesn't run again. Migrations must be idempotent: a retry re-runs every outstanding migration over every document.

On startup, `src/startup/migrateWorldIfNeeded.ts` runs any unflagged migrations (GM only). A brand new world flags them all as done without running them. If a run fails, it's retried on the next startup, up to `maximumAutomaticMigrationAttempts` times, after which it stops nagging and a GM can retry by hand from GUMSHOE Settings > Miscellaneous > Migration recovery.

(The older migration system, which re-ran everything whenever `systemMigrationVersion` changed, is gone. That setting is still recorded, but nothing triggers off it.)

To see the current state of flagged migrations, open the console and type

```js
console.log(JSON.stringify(game.settings.get("investigator", "migrationFlags"), null,  "  "))
```

There will be a flag in there for every migration that has been run. To force a migration to run again, delete its flag and reload. For example, to re-run the `addIdtoUnlocks` item migration:

```js
const flags = game.settings.get("investigator", "migrationFlags");
delete flags.item.addIdtoUnlocks;
await game.settings.set("investigator", "migrationFlags", flags);
```

## Compendium packs

The packs' source lives as YAML in [`src/packs/`](src/packs/), one file per document. The build compiles them into Foundry's database format in `build/packs`.

To change a pack:

1. Edit it in Foundry as normal (unlock the pack first: right-click it and `Toggle edit lock`).
2. Shut down the world, so Foundry lets go of the pack databases.
3. Run `pnpm run extract-packs`. This rewrites `src/packs/` from `build/packs`.
4. Check the changes in git and commit them.

You can also edit the YAML directly and rebuild.

## Translations

There are two npm tasks pertaining to translations:

* `pnpm run build-pack-translations` will:
  * populate `public/lang/babele-sources` with template translation files based on the packs.
  * These should be picked up by Transifex automatically.
* `pnpm run pull-translations` will:
  * use the Transifex command line tool, [`tx`](https://github.com/transifex/cli), to pull in the latest translations and overwrite all the JSONs.
  * THIS WILL CLOBBER ANY JSON MODIFICATIONS WHICH HAVE NOT BEEN UPLOADED TO TRANSIFEX!

To keep the translation imports running sweetly, you will need to update `.tx/config` to map everything to the right places.

The core strings are in [`public/lang/en.json`](public/lang/en.json). In code, `<Translate>Some text</Translate>` and `getTranslated("Some text")` look up the key `investigator.` + the text in PascalCase (via `Case.pascal`), so "Hit threshold" is `investigator.HitThreshold`. Punctuation is dropped, so "Shot dry!" and "Shot dry" share a key. New strings only show up in a running Foundry after a restart.

### How to pull translations from Transifex

```sh
pnpm run pull-translations
```

The command to pull translations has gone through a few iterations and never quite seemed right. Here's the current version (this is in `package.json`):

```sh
tx pull --all --force --workers 16
```

* `--all` - pull all languages, not just the pre-existing ones.
* `--workers 16` - seems to make sense on a 16-core machine. I'm not sure if it's actually helping.
* `--force` - overwrite "newer" files. This should only happen if there has been a PR or commit that changed the translations without also uploading those changes to Transifex.

> ⚠️ After running `pnpm run pull-translations` (or the `tx pull` command above), you MUST look through the changes in git and confirm that they make sense. Look for languages with a lot of changes and double check that you are not accidentally overwriting changes that were added to git but not TX.

### When someone sends a PR with translation changes

It's better to feed those into TX (resources -> language -> upload file) and then pull them back down again, rather than committing directly. This way TX remains the single source of truth for translations.

Alternatively, if the PR looks safe, you can merge it - but then you should upload the changes to TX and immediately pull them back down again to make sure that nothing else changed in the meantime.


### Getting set up to pull translations from Transifex

Install the Transifex command-line utility `tx` from https://github.com/transifex/cli

There is some older documentation somewhere on the Transifex website that talks about their old Python-based cli client - ignore that. You want the new one written in Go, as linked above.

The first time you try to pull translations, it will ask you to log in with an API token. It will give you instructions so I won't repeat them here.

I have a manual download which I keep checked-in with my dotfiles, but the other installation methods listed may be preferable.

## Adding document data fields

Document data is defined with Foundry's `TypeDataModel`s, one per subtype (e.g. `WeaponModel` in `src/module/items/weapon.ts`, `NPCModel` in `src/module/actors/npc.ts`).

1. Add the field to the model's schema, with an `initial` value so existing documents get a sensible default.
2. If you need to change the shape of existing data, add a `migrateData` step or a flagged migration (see [Migrations](#migrations)).
3. Add a setter to the model if the UI needs one (see the existing `set*` methods).
4. New document *subtypes* also need adding to `documentTypes` in [`public/system.json`](public/system.json), registering in `CONFIG.*.dataModels` and the `DataModelConfig` type in [`src/configuration.ts`](src/configuration.ts), and a `TYPES.*` label in `public/lang/en.json`.

## Adding system settings

1. Add an entry to [`src/settings/settings.ts`](src/settings/settings.ts), using the `createSetting*` helpers. Settings are exportable (part of presets and settings import/export) unless you pass `exportable: false`.
2. Add it to the `PresetV1` type in [`packages/investigator-fvtt-types`](packages/investigator-fvtt-types/index.ts), as an optional property with a doc comment. We haven't got as far as new `PresetV*` types yet. This is a workspace package, so the system picks it up straight away; publish a new version for anyone else using the types.
3. Add a sensible default to `pathOfCthulhuPreset` in [`src/presets.ts`](src/presets.ts) (it's `Required<PresetV1>`, so TypeScript will insist), and add values to the other presets if they need them. `pathOfCthulhuPreset` is the base layer when applying any preset, so older presets without the new key get this default.
4. In [`src/components/settings/`](src/components/settings/), add it to the JSX somewhere - see the existing examples. `settings` (from `StateContext`) has the unsaved value and `setters` has the setter.
5. Add a translation string for its label to [`public/lang/en.json`](public/lang/en.json) (or maybe [`public/lang/moribundWorld/en.json`](public/lang/moribundWorld/en.json) for MW stuffs).
6. Importing an export from an older version must keep working. Add the new key to `src/settings/validateImportedSettings.test.ts`, and to the fixture in `src/components/settings/store.test.ts` (then update its snapshots with `pnpm test --run -u`, after checking the diff).

A setting which has never been in a release can be renamed or removed without a migration.

## Using the "Developer mode" module

There's a Foundry VTT module called [🧙 Developer Mode](https://foundryvtt.com/packages/_dev-mode). It may no longer be maintained, but the system still supports it. You can also use it to activate specific developer features for systems. To do this, click on the little wizard dude in the top left of the screen, go to "Package specific debugging", and "Enable Debug Mode" for "INVESTIGATOR System".

What this enables (list subject to change):

* Notes fields will now have a "view source" mode (looks like `</>`.)
* "NUKE" button on PC character sheet (this used to be present all the time.)
* "Debug translations" option available in INVESTIGATOR System Settings.


## Development flow

* We develop on `main`, with occasional feature branches or forks as needed and wanted.
* We deliver both the public-facing manifest and the downloadable zip package using [tagged GitHub releases][gh-releases]
* The manifest in VCS points to the "latest package" of the manifest and the download.
* To do a release, we push a tag.
* The CI kicks in and:
  * Checks that the tag matches the version in the manifest. Barfs if not right.
  * Works out the release asset URL and set the `download` path.
  * Runs tests.
  * Runs the build.
  * Creates the zip package.
  * Creates/updates a tagged release with two extra attachments:
    * The zip package
    * The manifest
  * If the tag is a release (i.e.there is no pre-release suffix), it also marks the release as "latest" on GitHub.
  * You can always find the latest release at the URL https://github.com/lumphammer/gumshoe-fvtt/releases/latest


## Release process

> The innocuous-looking 4.9.7 release represented a change in how we do releases. We used to have a `release` branch which pointed to the most recent release, with attachment links pasted into `system.json` for the download. For the foreseeable future we will need to fast-forward `release` to `main` when releasing to make sure we catch slow updaters*
>
> 7.0.0 will be (probably) the first release from GitHub:
> * Uses GitGub actions instead of GitLab CI
> * Uses GitHub Releases instead of GitLab Generic Packages
>
> As of 8.2.1 We no longer need to create the release by hand on the Foundry website - it's all handled by a GitHub action. You can see the package management page at https://foundryvtt.com/packages/investigator/edit to check it's worked if you like.
>
> As of 8.3, we're dropping the patch number, and also dropping the prerelease signifiers. The latter is because FVTT doesn't recognise them, making it hard to upgrade from a prerelease. The former is to fall in line with FVTT's own numbering scheme, and because the semantics of "semantic versioning" don't really apply to an FVTT package.

To perform a release:

1. Decide if you're doing a testing release or a real release. DO DO A TESTING RELEASE AND CHECK IT ON A TEST SERVER.
2. Pick the new version number by incrementing the second part of of the curent number, e.g. `8.3` -> `8.4`. WE NO LONGER USE SEMVER.
3. Update the version in
   * [`package.json`](package.json)
   * [`system.json`](public/system.json).
4. For a full release, update the [`CHANGELOG`](CHANGELOG.md).
5. Run this one handy command, which will commit, push, and create a new tag and push it also:

    ```sh
    pnpm run do-prerelease
    ```

    or

    ```sh
    pnpm run do-full-release
    ```

6. If this is a test release, stop here. You can find the manifest URL to install this test release on [the GitHub releases page][gh-releases].

   Otherwise, continue.

7. Fast-forward `release` to `main`:

    ```sh
    pnpm run update-legacy-release-branch
    ```

8. Wait for the release email from GitHub (or go to the [CI page][gh-ci] and wait for the pipeline to finish if you're rushing.)

9. Barf forth glad tidings on the [Pelgrane's Virtual Tabletops Discord channel][pelgrane-discord] and the [Foundry Package Releases channel][fprd].

    Paste in the CHANGELOG entry you just wrote, adding "INVESTIGATOR" in front of the version number to give people context.

### What happens if the CI pipeline fails?

1. Delete the `vX.Y.Z` tag from local and remote:

    ```sh
    git tag -d vX.Y.Z
    git push origin :refs/tags/vX.Y.Z
    ```

2. Fix the problem, commit.
3. Run `pnpm run do-prerelease` or `pnpm run do-full-release` again.


## GitLab Legacy

As of v7.0.0 we are moving off GitLab and going home to GitHub. The following links are historical purposes only:

* [GitLab CI pipeline][gl-ci]
* [GitLab Releases][gl-releases]
* [GitLab Generic Packages (docs)][gl-generic-packages]


## fvtt-types

We use the community [`fvtt-types`](https://github.com/League-of-Foundry-Developers/foundry-vtt-types) for Foundry's core types. The version is pinned in the `catalog` in [`pnpm-workspace.yaml`](pnpm-workspace.yaml), and shared by the workspace packages. To try a branch straight from GitHub, run `./scripts/install-fvtt-types.sh <branch>`.

The types are good these days, but some corners of Foundry are hard to express in TypeScript, so you'll still see the occasional `@ts-expect-error fvtt-types`.


[gl-generic-packages]: https://docs.gitlab.com/ee/user/packages/generic_packages/
[gl-releases]: https://gitlab.com/n3dst4/investigator-fvtt/-/releases
[gl-ci]: https://gitlab.com/n3dst4/investigator-fvtt/-/pipelines
[gh-ci]: https://github.com/lumphammer/gumshoe-fvtt/actions/workflows/ci-cd.yml
[pelgrane-discord]: https://discord.com/channels/692113540210753568/720741108937916518
[fprd]: https://discord.com/channels/170995199584108546/64821535989524071
[gh-releases]: https://github.com/lumphammer/gumshoe-fvtt/releases
