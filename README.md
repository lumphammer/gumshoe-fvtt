# GUMSHOE for Foundry VTT (aka INVESTIGATOR)

Official GUMSHOE SRD-compatible system for Foundry VTT. Ships with compatibility for several settings, and can be customized to work with any other setting. Rules relating to anything outside of the character sheet are not included, so you'll need to own a compatible game in order to play.

Includes over a dozen character sheet themes, including a high-contrast accessible theme.

![A screenshot of seven different character sheet themes](./assets/screenshots/theme_lineup_thumbnail.jpg)

[(Full size image)](assets/screenshots/theme_lineup.webp)

## Contents
- [GUMSHOE for Foundry VTT (aka INVESTIGATOR)](#gumshoe-for-foundry-vtt-aka-investigator)
  - [Contents](#contents)
  - [Features](#features)
  - [How to install](#how-to-install)
  - [Using the built-in game systems](#using-the-built-in-game-systems)
  - [Adding your own abilities](#adding-your-own-abilities)
  - [Translations](#translations)
  - [Setting up any system that isn't built in](#setting-up-any-system-that-isnt-built-in)
  - [Creating Characters](#creating-characters)
  - [Using Abilities](#using-abilities)
  - [Party Tracker](#party-tracker)
  - [Bug reports and contact](#bug-reports-and-contact)
  - [Development \& general hacking](#development--general-hacking)
  - [Custom themes](#custom-themes)
  - [Brief history of major versions](#brief-history-of-major-versions)
  - [Credits](#credits)
    - [GUMSHOE SRD Creative Commons](#gumshoe-srd-creative-commons)


## Features

* A character sheet which tracks ratings and pools for all your Investigative and General abilities!
* Spend pool points!
* Roll general ability tests!
* Refresh an individual ability or refresh all your pools at once!
* Built-in presets for several games:
  * Trail of Cthulhu
  * Night's Black Agents
  * Ashen Stars
  * Fear Itself
  * The Esoterrorists
  * Mutant City Blues
  * Casting the Runes
  * Dying Earth
* Fully extensible to support any GUMSHOE-compatible game
* Equipment and weapons, with weapon attacks from the character sheet
* Optional combat rules: turn-passing initiative, NPC combat bonuses, and damage application (targets, Hit Thresholds, cover, armor, critical hits), plus the crunchier *Fall of DELTA GREEN* rules (Lethality, three-round bursts, full-auto, Shot Dry, weapon jams, and walking fire)
* Cards (e.g. *Mutant City Blues* stresses and genetic risk factors)
* Party tracker (aka investigator matrix)
* Multiple visual themes
* A high-contrast, (hopefully) accessibility-enhanced theme.


## How to install

I'm going to assume you have a working knowledge of [Foundry VTT](https://foundryvtt.com/), and the concepts it uses, like systems, modules, and worlds.

1. On the admin screen, go to **Game Systems**
2. Click **Install System**
3. In the top-right, where it says "Filter Packages", type "gumshoe".
4. The first (or only) result should be "GUMSHOE".
5. Click the **Install** button next to it.

Now you can create a new world and choose this as the system.

## Using the built-in game systems

The system comes preconfigured for **Trail of Cthulhu**. If that's what you want to play, you can skip this section and start making PCs.

If you want to use one of the other built-in systems, open the Settings sidebar tab and click the **Open GUMSHOE System Settings** button. You can ignore 90% of this window and just choose one of the presets under **Core**! If you want to tweak the other settings you can do so.

Each built-in system comes with its full list of abilities, under their own names, thanks to the good people at Pelgrane Press.


## Adding your own abilities

If you want extra or house-ruled abilities on top of a built-in list:

1. In the Items tab, create a new folder. Give it a name like "Cthulhu extra abilities" or whatever.
2. Add abilities as follows:

    1. Click the button to create an item in the folder.
    2. Pick "Investigative Ability" or "General Ability"
    3. Configure the ability as needed.
    4. Repeat until you have all the additional abilities you need.

3. Right-click the folder and Export to Compendium.
4. Flip over to the Game Settings tab and click **Open GUMSHOE System Settings**.
5. Under **Core**, pick the System Preset that you want.
6. Under **Abilities**, go to **PC Ability compendiums** and put a tick (check) next to the name of your new "Extra abilities" compendium, as well as the built-in one.

Done! New PCs will now automatically be given the abilities in your new compendium. Also, if you create a party tracker, it will show those abilities in the list.

## Translations

Thanks to Foundry's translation systems, plus the excellent [Babele](https://gitlab.com/riccisi/foundryvtt-babele) module, and the enormous contributions from many volunteers, INVESTIGATOR will work in more languages than just my native English! Check out the [Translations page on the wiki](https://github.com/lumphammer/gumshoe-fvtt/wiki/Translations) to see what has been translated into which languages and get instructions if you'd like to contribute a translation.


## Setting up any system that isn't built in

The basic idea is that all character abilities are "Items" in Foundry VTT-speak.

The abilities that get added to a newly-created character all have to come from a **Compendium pack** (of type **"Item"**).

So, first up, create a compendium pack to house your custom abilities. Give it a name like "Exampleshoe Abilities", if you're going to play Exampleshoe. You don't need to fill in the abilities yet.

Now open the **Game Settings** sidebar tab and click the **Open GUMSHOE System Settings** button. Under **Core**, pick any built-in system as a starting point, then customize the settings to match your needs. The most important ones are:

* **Core > Visual Theme** We ship with a bunch of visual themes to support our built-in systems. You can pick whichever one you like.
* **Abilities > PC Ability compendiums** This is a really important one. This selects what abilities will be automatically added to newly-created characters. Select the compendium you created for your custom abilities and **UNSELECT** everything else. You *could* leave multiple packs selected but you probably don't want to. (There's an equivalent for NPCs.)
* **Abilities > Investigative ability categories** These are just the headings that investigative abilities can appear under. It's worth noting that any ability can define its own category, so this setting is mainly for convenience when you're setting up new abilities.
* **Abilities > General ability categories** Like above, but for General abilities. Many games only have one category for General abilities, called "General".
* **Combat > Combat abilities** This is a list of the abilities (by name) which can be used to make attacks in combat.
* **Actors > Personal details** The "small" fields on the character sheet, after **Name** and **Occupation**, for things like "Drive" and "Previous Patron".
* **Actors > Notes Fields** A list of all the long text areas on the character sheet, like "Notes", "Background", "Contacts" etc.

Now you can create the abilities you need as items in the **Items directory**, and then add them to your compendium pack.

* **Pool** and **Rating** should be clear if you're familiar with investigative game systems like this. Set the rating if you want characters to automatically start with a certain amount in that ability. Set the pool to match if you like, so they don't start out with an empty pool.

Click the cog to see all the other config for an ability:

* **Name** e.g. "Philately", "Rock climbing" (you can also type this in directly at the top of the window)
* **Category** the drop-down will give you quick access to the **ability categories** you set up before. Abilities can also have custom categories.
* **Min** and **Max** Some abilities can go negative, like Health and Stability, so you can give them a negative Min here. The Max is probably overkill and will likely be removed in a future update.
* **Has Specialities?** If ticked, you will be able to add individual specialities to the ability. This is for abilities like **Language**, where you can add the individual languages your character knows.
* **Occupational?** This is more for use when you're setting up an individual character - you can mark an ability as occupational for your own reference. We don't support points-based character generation (yet) so this is just for informational purposes.
* **Can be investigative?** Another informational field. Some General Abilities are deemed to have an investigative usage, so they can be used "just by having them".
* **Show Tracker?** Another important one - if ticked, the character sheet will show a clickable pool tracker for this ability. This is key for abilities like Health, Sanity, etc.


## Creating Characters

Create a character in the normal way, through the **Actors directory**. It should be pre-populated with the right abilities for your system.

Most of the character sheet should be self explanatory.

## Using Abilities

Using Investigative abilities doesn't require any active effort - you just tell the GM that you're using `Geology` or whatever.

If you want to **spend points**, open the ability from your character sheet and choose the number of points to spend.

General abilities can also be **rolled** - choose the number of points to expend and click **Test**.

## Party Tracker

As a GM, maybe you want to see a quick overview of all the abilities your players have between them, to make sure all your investigative bases are covered. This is sometimes called an "investigator matrix".

To create a party tracker:

1. Create a new actor, and choose "party" as the type.
2. The "sheet" for this party will open, showing you all the standard abilities configured at the moment.
3. **Drag** PC actors from the sidebar into the party tracker sheet to add them.
4. You can directly pop open a character's ability from the tracker, for rapid adjusting.
5. Totals adjust in real-time as you edit abilities.

You can create multiple "party" actors if you want to track different groups of PCs as needed for your campaign.


## Bug reports and contact

If you have a GitHub account, then by all means log an issue over at [the project site][project-site]. Pull requests are also welcome!

Otherwise you can email me at `neil at lumphammer.com`, or hit me up on Discord (search for `n3dst4`.)


## Development & general hacking

Contributions, bug fixes, pull requests all welcome! Please see [DEVELOPMENT.md](DEVELOPMENT.md).


## Custom themes

You can create new themes for INVESTIGATOR in two ways:

* [By writing a Foundry VTT module which uses INVESTIGATOR's API to inject a new theme](https://github.com/lumphammer/gumshoe-fvtt/wiki/Adding-new-content-from-third-party-code) (this is intended for developers and module authors.)
* [By dropping a JSON file in a folder in your local data](https://github.com/lumphammer/gumshoe-fvtt/wiki/Adding-new-themes-from-local-data) (this is intended for technical users who are not authoring modules.)


## Brief history of major versions

| Version | Date       | Reason                             |
| --------| ---------- | ---------------------------------- |
| 1.0.0   | 2021-01-31 | Initial *Trail of Cthulhu* system  |
| 2.0.0   | 2021-02-26 | Re-launch as *GUMSHOE*             |
| 3.0.0   | 2021-07-03 | Re-branded as *INVESTIGATOR*       |
| 4.0.0   | 2021-08-14 | Minimum Foundry version 0.8.0      |
| 5.0.0   | 2022-08-08 | Minimum Foundry version 9          |
| 6.0.0   | 2023-01-08 | Minimum Foundry version 10         |
| 7.0.0   | 2023-06-01 | Return to *GUMSHOE* branding       |
| 8.0.0   | 2024-05-30 | Minimum Foundry version 11         |
| 9.4     | 2025-05-24 | Minimum Foundry version 13         |
| 10.115  | 2026-04-08 | Minimum Foundry version 14         |


## Credits

Wallpapers and masks are in `public/assets/wallpaper` unless noted. Each
credit lists the files made from that image.

Photos from [Unsplash](https://unsplash.com/):

- [Annie Spratt](https://unsplash.com/@anniespratt):
  - [osuiatBDTww](https://unsplash.com/photos/osuiatBDTww): `annie-spratt-osuiatBDTww-unsplash.webp`
  - [xTaOPMa6wAE](https://unsplash.com/photos/xTaOPMa6wAE): `annie-spratt-xTaOPMa6wAE-unsplash.webp`
  - [xvU-X0GV9-o](https://unsplash.com/photos/xvU-X0GV9-o): `annie-spratt-xvU-X0GV9-o-unsplash.webp`
  - [UR2DMIFuc5c](https://unsplash.com/photos/UR2DMIFuc5c): `stonelike-mask.webp`
- [Марьян Блан | @marjanblan](https://unsplash.com/@marjan_blan): [photo](https://unsplash.com/photos/5Ft4NWTmeJE): `marjanblan-5Ft4NWTmeJE-unsplash.webp`
- [Tina Dawson](https://unsplash.com/@leyameera): [photo](https://unsplash.com/photos/Kim9COAIEGc): `nice_red_agents.webp`
- [Philipp Trubchenko](https://unsplash.com/@seresigo): [photo](https://unsplash.com/photos/jObj_p885Gg): `philipp-trubchenko-jObj_p885Gg-unsplash.webp`
- [guille pozzi](https://unsplash.com/@guillepozzi): [photo](https://unsplash.com/photos/sbcIAn4Mn14): `guille-pozzi-sbcIAn4Mn14-unsplash.webp`
- [Scott Webb](https://unsplash.com/@scottwebb): [photo](https://unsplash.com/photos/UjupleczBOY): `scott-webb-UjupleczBOY-unsplash.webp`
- [Kiwihug](https://unsplash.com/@kiwihug): [photo](https://unsplash.com/photos/white-wall-paint-with-black-shadow-y_2GC4EhOP4): `pulpy_paper.webp`
- [Paweł Czerwiński](https://unsplash.com/@pawel_czerwinski): [photo](https://unsplash.com/photos/RPMcxbm2zi4): `monochrome-unreality-cropped.webp`
- [Jarrod Erbe](https://unsplash.com/@erbephoto): [photo](https://unsplash.com/photos/white-and-gray-concrete-wall-e0pkhy2hWic): `grunge-gradient.webp`
- [Meriç Dağlı](https://unsplash.com/@meric): `red_sands.jpg`
- [remi skatulski](https://unsplash.com/@remiskatulski): `assets/cover.webp` (the cover image)

Marble texture by north_studio from
[Pixabay](https://pixabay.com/illustrations/marble-background-black-texture-2398956/):
`north_studio-marble-2398956_1280.webp`.

Illustrations from [Old Book Illustrations](https://www.oldbookillustrations.com/):
`tailpiece9-768.webp`.

`esoterica.webp` and `textured-mask.webp` are our own, made with public domain
brushes.

Longdon Decorative (`public/fonts/LongdonDecorative.woff2`) is by Roger White,
who released his fonts into the public domain, asking only that commercial users
acknowledge the source ([his site, archived](https://web.archive.org/web/20120416090521/http://www.rogersfonts.org.uk/)).
We use [a fixed version](https://github.com/n3dst4/longdon-decorative-fixed).

Huge thanks to Nick van Oosten/NickEast for [Foundry Project Creator](https://gitlab.com/foundry-projects/foundry-pc/create-foundry-project) and the original [the Typescript types to go with it](https://gitlab.com/foundry-projects/foundry-pc/foundry-pc-types).

Current types are provided by the excellent [League of Foundry Developers](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

Icons are created on https://game-icons.net/ and used under the [CC-BY-3.0 Creative Commons licence](https://creativecommons.org/licenses/by/3.0/).

Interface icons come from [react-icons](https://react-icons.github.io/react-icons/), which collects several icon sets: [Font Awesome](https://fontawesome.com/) and [VS Code Codicons](https://github.com/microsoft/vscode-codicons) under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/), [Material Design icons](https://github.com/google/material-design-icons) under Apache-2.0, and Ant Design, Bootstrap, Heroicons, Lucide, Phosphor and Tabler icons under MIT or ISC.

The build writes `THIRD-PARTY-LICENSES.txt`, with the licences of all the code and icon sets bundled into INVESTIGATOR.

Thanks to [The Design Mechanism](https://thedesignmechanism.com) for permission to use the ability list from Casting the Runes.

### GUMSHOE SRD Creative Commons

This work is based on the GUMSHOE SRD (found at http://www.pelgranepress.com/?p=12466), a product of Pelgrane Press, developed, written, and edited by Robin D. Laws with additional material by Kenneth Hite, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/)

[project-site]: https://github.com/lumphammer/gumshoe-fvtt/issues
