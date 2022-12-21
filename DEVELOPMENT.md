# Development notes

- [Development notes](#development-notes)
  - [Development & general hacking](#development--general-hacking)
  - [Migrations](#migrations)
  - [Generating Compendium packs](#generating-compendium-packs)
  - [Translations](#translations)
    - [Getting set up to pull translations from Transifex](#getting-set-up-to-pull-translations-from-transifex)
  - [Adding Actor or Item data fields](#adding-actor-or-item-data-fields)
  - [Adding system settings](#adding-system-settings)
  - [Using the "Developer mode" module](#using-the-developer-mode-module)
  - [Development flow](#development-flow)
  - [Release process](#release-process)
    - [What happens if the CI pipeline fails?](#what-happens-if-the-ci-pipeline-fails)

## Development & general hacking

If you're a developer and you'd like to hack on this code, please be aware it uses Webpack and React so some of it will not look like normal Handlebars + JQuery Foundry stuff.

1. Clone the repo.
2. Copy `foundryconfig_template.json` to `foundryconfig.json` and edit it to fill in the `dataPath`, e.g.  `"dataPath" "/home/ndc/foundrydata",`.
3. `npm i` to install dependencies
4. `npm run build` to do a build
5. `npm run link` to link it into your foundry data folder
6. `npm start` to start a live incremental build (so you don't need to keep running `npm run build` after every change).
7. Open your local foundry server and create a world using this as the system.

## Migrations

The migrations system is inspired by an earlier version of the one in the 5e system. It is triggered from `investigator.ts` based on version number.

If you want to force migrations to run, try this:

```ts
game.settings.set("investigator","systemMigrationVersion", "1.0.0")
```


## Generating Compendium packs

1. In your **Items** tab, delete the "Trail of Cthulhu Abilies" folder
2. In the **Compendium Packs** tab, make sure the edit lock is toggled off for the pack (right click and `Toggle edit lock` if you see a padlock.) 
3. Open the browser console (F12) and type `generateTrailAbilitiesData()`
4. Check the compenium packs if you like
5. Copy the `packs/*.db` files back from `dist/` into `src/`

## Translations

There are three npm tasks pertaining to translations:

* `npm run groom-translations` will:
  * alphabetise `en.json` and all the other core translations.
  * report any missing translations.
  * report any "extra" translations.
* `npm run extract-pack-translation-templates` will:
  * populate `src/lang/babele-sources` with template translation files based on the packs.
  * YOU WILL PROBABLY WANT TO UPLOAD THESE TO TRANSIFEX IF THEY CHANGE.
* `npm run pull-translations` will:
  * use the Transifex command line tool, [`tx`](https://github.com/transifex/cli), to pull in the latest translations and overwrite all the JSONs.
  * THIS WILL CLOBBER ANY JSON MODIFICATIONS WHICH HAVE NOT BEEN UPLOADED TO TRANSIFEX!

To keep the translation imports running sweetly, you will need to update `.tx/config` to map everything to the right places.

### Getting set up to pull translations from Transifex

Install the Transifex commandline utility `tx` from https://github.com/transifex/cli

There is some older documentation somewhere on the Transifes website that talks about their old Python-based cli client - ignore that. You want the new one written in Go, as linked above.

The first time you try to pull translations, it will ask you to log in with an API token. It will give you instructions so I won't repeat them here.

I have a manual download which I keep checked-in with my dotfiles, but the other installation methods listed may be preferable.

## Adding Actor or Item data fields

1. Add the field to [`src/template.json`](). This is what Foundry uses to generate initial data for new actors and items, and to do some kind of validation on entries when they get saved.
2. Add the field to [`src/types.ts`](), in the appropriate `*SourceData` type.
3. In  `src/module/InvestigatorActor.ts`, add `get*` and `set*` methods with the appropriate `assert*` call (see existing examples.)


## Adding system settings

1. Add an entry to [`src/settings.ts`]().
2. Add it to the `PresetV1` type in `@lumphammer/investrigator-fvvt-type`, publish, and update the package version here. We haven't got as far as new `PresetV*` types yet, so make sure you add it as an optional property.
3. Add a sensible default to `pathOfCthulhuPreset` in `src/settings.ts`, and add values to the other presets if they need them.
4. In [`src/components/settings/`](), add it to the JSX somewhere - see the existing examples. `tempSettings` will contain the value and `setters` will have the setter.
5. You will probably need to add a translation string to [`public/lang/en.json`]() or maybe [`public/lang/moribundWorld/en.json`]() for MW stuffs.
6. If it's a setting that caan be controlled by system presets, also add it to the `PresetV1` type in @lumphammer/investigator-fvtt-types and publish a new version.


## Using the "Developer mode" module

There's a fantastic Foundry VTT module called [🧙 Developer Mode](https://foundryvtt.com/packages/_dev-mode). I highly recommend installing it if you're doing any development work on Foundry. You can also use it to activate specific developer features for systems. To do this, click on the little wizard dude in the top left of the screen, go to "Package specific debugging", and "Enable Debug Mode" for "INVESTIGATOR System".

What this enables (list subject to change):

* Notes fields will now have a "view source" mode (looks like `</>`.)
* "NUKE" button on PC character sheet (this used to be present all the time.)
* "Debug translations" option available in INVESTIGATOR System Settings.


## Development flow

* We develop on `main`, with occasional feature branches or forks as needed and wanted.
* We deliver both the public-facing manifest and the downloadable zip package using [GitLab Generic Packages][gl-generic-packages].
* The manifest in VCS points to the "latest package" of the manifest and the download.
* To do a release, we push a tag.
* The CI kicks in and:
  * Checks that the tag matches the version in the manifest. Barfs if not right.
  * Works out the release asset URL and set the `download` path.
  * Runs the build.
  * Uploads a "latest package" of the manifest.
  * Uploads a "latest package" of the actual package.
  * Creates a release with linked assets for the above.


## Release process

*The innocuous-looking 4.9.7 release represented a change in how we do releases. We used to have a `release` branch which pointed to the most recent release, with attachment links pasted into `system.json` for the download. For the foreseeable future we will need to fast-forward `release` to `main` when releasing to make sure we catch slow updaters*

To perform a release: 

1. Update the version in
   * [`package.json`](package.json)
   * [`system.json`](public/system.json).
2. Update the `CHANGELOG`.
3. Run this one handy command, which will commit, push, and create a new tag and push it also:

    ```
    scripts/do-release.sh
    ```

4. Fast-forward `release` to `main` (yes this is a funky use of `fetch`):

    ```
    scripts/update-legacy-release-branch.sh
    ```

5. Head over to the [CI page][ci] and wait for the pipeline to finish.

6. Create a new release on https://foundryvtt.com/admin/packages/package/948/change/

7. Go and barf forth glad tidings on the [Pelgrane's Virtual Tabletops Discord channel][pelgrane-discord] and the [Foundry Package Releases channel][fprd].

### What happens if the CI pipeline fails?

1. Delete the `vX.Y.Z` tag from local and remote:

    ```sh
    git tag -d vX.Y.Z
    git push origin :refs/tags/vX.Y.Z
    ```

2. Fix the problem, commit.
3. Run `do-release.sh` again.


[gl-generic-packages]: https://docs.gitlab.com/ee/user/packages/generic_packages/
[ci]: https://gitlab.com/n3dst4/investigator-fvtt/-/pipelines
[pelgrane-discord]: https://discord.com/channels/692113540210753568/720741108937916518
[fprd]: https://discord.com/channels/170995199584108546/64821535989524071
