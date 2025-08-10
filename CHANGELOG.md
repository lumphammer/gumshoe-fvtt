# CHANGELOG

(Skipped version numbers are testing releases.)

## Unreleased

* Fixes for some issues encountered on Forge VTT:
  * Error message in console about `cssRules`.
  * File picker not showing "Forge Assets" and "Bazaaar".
* Behind the scenes: completely reworked combat, in preparation for being able to do more advanmced combat stuff in future.


## 9.10 (2025-06-08)

* BUGFIX: Weapons created in the sidebar would throw an error when opening their edit sheet (#1204, thanks @dorf-lundgren)


## 9.8 (2025-06-06)

* BUGFIX: The new combat tracker now looks right when popped out from the sidebar (#1194)
* BUGFIX: Compendium import/export working again like it did under previous Foundry versions (#1197)
* The PC sheet was not navigable for users with "Observer" permisssions. This is now fixed. (#1198)
* Secrets were going bananas in the rich text editor. This is fixed. (#1200)
* The rich text editor was looking really basic because the Foundry built-in styles for TinyMCE are broken in v13. Fixed. (#1202)

Cool behind the scenes change:

* GUMSHOE now uses the new `DataModel` system and `ApplicationV2`, so apart from TinyMCE it should be fairly future-proof.


## 9.4 (2025-05-24)

Headline:  **Foundry VTT v13 compatibility-we-really-mean-it-this-time AND a reworked combat tracker**.

Turns out I'd been a bit trigger happy with marking the system as v13 compatible during the v13 development cycle and the combat tracker had become broken ([#1173][1]) in one of the later dev releases.

[1]: https://github.com/lumphammer/gumshoe-fvtt/issues/1173

This release features a completely reworked combat tracker using Foundry's ApplicationV2 system, plus a bunch of fixes for deprecations warnings. This means **we're dropping support for v12 here**.

Thanks to @dorf-lundgren on GitHub for the report and @Seamonster for testing.


## 8.7 (2025-05-11)

* **NEW TRANSLATIONS**: Many languages have had their translations updated by kind volunteers and a whole new translation for Italian has been added!

An apology: I wasn't getting notifications from Transifex so a LOT of translations had been added and updated without me realising. It wasn't until `vond` sent me a PR with the updated French translations that I went to check.

## 8.4 (2025-02-09)

Two fixes for reported bugs:

* @Seamonster reported that the fear Itself "Shooting" ability was set to go first in combat, like in Night's Black Agents. This is fixed, along with the corresponding ability in Ashen Stars and SRD Abilities.
* @Muwak reported that the custom health ability Gesundheit wasn't updating the "health" resource. This is now fixed or at least fixable because of the new feature...

New feature!

* Any general ability can now be use to synchronise any resource attribute! Just pop over to the config, check **"Link to resource"**, and type in an identifier. The next time the pool changes, it will start synchronising with a resource of the same name.
* Resources set up this way will also sync *back* now - so you can right click an avatar, type a value into the health field, and hit return, and it will update your health ability.

Other stuff in this release:

Lots of behind the scene stuff.


## 8.2.4 (2024-11-24)

* **BUG FIX**: Settings import is broken if the export contained card categories (#962)
* **BUG FIX**: "Social Sciences" is missing from the list of Academic skills in the Fear Itself abilities compendium (#1047) Cheers @SeaMonster!
* **BUG FIX**: Night's Black Agents NPC abilities have been overhauled because they barely overlap with the SRD NPC abilities. Original bug report was "Missing Hand-to-Hand in Night's Black Agents NPC Abilities (#1040)". Thanks `geoffk` for the report.
* **BUG FIX**: Missing Technical Skill "Forensic Pathology" for NBA (#1058). Thanks `geoffk` again.


## 8.2.1 (2024-10-08)

* Links had stopped working in notes areas (like NPCs). Cheers @muwak for the spot.


## 8.2.0 (2024-10-07)

* **SMALL BUT USEFUL REDESIGNS**: The weapon sheet now makes FAR more sense. Also, everywhere you can set a "combat ability", it handles the weird cases where it's using an ability that the character doesn't have.
* **RELATED BUG FIX**: Actors were being created with no combat ability. This is now fixed, and also any existing actor that still doesn't have one will get one.
* **BUG FIX**: GMs can now edit text on characters created by players.
* **BUG FIX**: Non-GMs used to be able to see the "GUMSHOE Settings" button, even though they couldn't edit anything.
* **BUG FIX**: Newly created weapons will now have a valid combat ability set. Prior, it was always "Scuffling", which just so happens to be valid in every system except Night's Black Agents.
* **BUG FIX**: Cherries/unlocks that were set up using using any version between 4.11.0 (2022-05-31) and 7.0.0 (2023-06-01) were not migrated properly, so you saw the same cherry repeated in the editor (the actual display was fine though.)
* **BUG FIX**: the portrait image on actor sheets now frames towards the top of the image if it's proportionally taller than the available space. This should work ion more situations to show the character's *face* rather than their chest and is also consistent with how Foundry does it in the sidebar.
* **BUG FIX**: All the general abilities had their max set to 8 for no discernable reason. I guess this was enough for a lot of people, but certain games (like Night's Black Agents) tend towards higher ranks in some abilities. This is now fixed.
* **BTS STUFF**: This is a system-work heavy release. Hopefully none of those changes will be visible.


## 8.1.0 (2024-09-23)

* **HEADLINE**: GUMSHOE QuickShock support! The number one feature request is now here. We have a new item type ("card"), and options to make abilities use pushes instead of points pools.
  * There is some documentation in the wiki about how to use these new features: https://github.com/n3dst4/gumshoe-fvtt/wiki/QuickShock-GUMSHOE-support-in-INVESTIGATOR
  * This is phase 1! It targets Mutant City Blues 2nd Edition, because it's a simpler version of the rules.  **PLEASE COME TO THE PELGRANE DISCORD AND YELL AT ME IF YOU HAVE ANY QUESTIONS**.
  * Huge thanks to @jwmuk, @ElCucuy, and anyone else who chipped in comments and info on this.
* **HEADLINE**: Mutant City Blues 2nd Edition is now included as a built-in system. This is the first QuickShockesque system to be included and comes with a cool new character sheet theme. Huge thanks to everyone who chipped in comments and info on this is QS Support.
  * *NOTE: Just like other built-in systems, we can't include any book text, so abilities, powers, and cards only have a name.*
* **SMALLER HEADLINE**: Some general visual tweaks to input grids so they line up nicer and are easier to read. We're also using toggle switches instead of checkboxes almost everywhere. Cheers to @Deadairis for sharing an old-man moment with me.
* **HANDY NEW FEATURE**: Abilities pools can now be allowed to exceed their rating. Enable "allow pool to exceed rating" in the settings. The new maximum pool is the "Max" value of the ability (which used to be just the maximum that the rating could go to). This will affect sidebar trackers and the "pool" input on the ability sheet.
* **OBVIOUS NEW FEATURE**: Pools can now go down to the ability's "Min" value.
* **NEAT NEW FEATURE**: There's a new option to automatically send a chat message to affected users when an item is added to an actor. This us useful with cards in particular.
* **WAS IT A BUG, IS IT A FEATURE?**: Document types are now translated, so e.g. when you create a new actor, the options are "Player Character", "Non-Player Character", and "Party" (not "pc", "npc", "party"). Thanks @ChaosOS for the report and the code for the fix!
* **BUG FIX**: There was something janky before where we weren't properly unregistering Foundry's default character sheet, which was causing problems for some people. Thank you to the person who reported this, I'm afraid I can't find their name.
* **TINY BUG FIX** Hitting escape in the setting window would close it without saving or prompting for confirmation. Fixed.
* **ANOTHER BUG FIX** Deep in the config for equipment categories, it previously impossible to set a field to "text" if it had been set to anything else previously. Fixed.
* **BTS STUFF**: Various stuff you don't care about.


## 8.0.0 (2024-05-30)

* **Foundry VTT v12 Support.** This release drops support for v10 and adds support for v12. v11 should continue to work, if you're trapped on that version due to other modules not having updated yet. For those who move to v12, let me know how it goes! (#711)
* **Compendium packs now live in neatly organised folders.** Now we've dropped v10, the increasing number of compendium packs are now tucked away in folders so they don't clutter up your sidebar so much. (#776)
* **Replaced Patrick Hand with Averia.** The beloved handwriting font from version 1.0.0 has gone to live on a farm and been replaced with something hopefully more legible. (#778)
* **BUG FIX: NBA abilities now include Forensic Pathology.** Thanks, @Monkeyboy! (#768)
* **BUG FIX: Night's Black Agents now includes Aberrance as an NPC ability.** Thanks, @csmacdougall!


## 7.9.0 (2024-04-20)

* **BUG FIX**: INVESTIGATOR now works with the [Tokenizer module](https://foundryvtt.com/packages/vtta-tokenizer/) (#706)
* **ENHANCEMENT**: Updated Polish translations for secrets and Moribund World Thanks @Marksjus (#711)
* **ENHANCEMENT**: Tweaked German translations for Night's Black Agents and Trail of Cthulhu. Thanks @Lhun and @Muwak (#712)

This will probably be the last release that supports Foundry V10. Foundry V12 is about to enter its testing phase so I want to be sure to support V12 at launch.

## 7.8.0 (2024-03-11)

* **BUG FIX**: Secrets now work in actor and items notes fields (#639).
* **FEATURE**: Dying Earth RPG ability compendium is now included.
* **ENHANCEMENT**: Foundry cover art is now the actual GUMSHOE logo.

## 7.7.0 (2024-02-12)

* **BUG IF**: Deleting a compendium that's selected for new PCs causes the Party sheet to crap out (#603).
* **FEATURE**: GM-Note-Field on NPC Sheet (#618) (thanks @muwak for the prod).

## 7.6.0 (2023-12-31)

* Happy new year!
* **FEATURE** - a new stripped-back sheet for NPCs for when the user has "limited" rights (#235). Thanks @muwak for this one!
* **ENHANCEMENT** - "Moribund World" replaced with "Dying Earth" in more places. Cheers @marksjus!
* **ENHANCEMENT** - Various translation updates - thanks to everyone who contributed!
* **BUG FIX** Images with brackets in the file name now show up in the party tracker (#518).
* **BUG FIX** Fix a small weirdness when changing the "notes format" for PCs (#519).
* **BUG FIX** Initiative order works as intended again (#281).

## 7.5.1 (2023-10-21)

* Updated Polish translations for the new import/export features. Thanks @marksjus (#503)

## 7.5.0 (2023-10-19)

* **BUG FIX: Newly created PCs now have a occupation**, as intended (#474).
* **BUG FIX: The "logo" on the character sheet was looking a bit weird** in some circumstances. Fixed (#476).
* **BUG FIX: "Chtulhu Mythos" typo now corrected to "Cthulhu Mythos"** (#477). Thanks @chrisjensenromer! And *shame* on anyone else who noticed but didn't let me know.
* **BUG FIX: PC actor won't open in v7.5.0-alpha.1** (#504). Cheers @marksjus for the testing and the bug report.
* **NEW FEATURE! You can now import and export your settings to a JSON file.** This is useful for:

  * Backing up your settings.
  * Sharing your settings with other people.

  **This feature is being considered BETA for now**. Bear in mind that importing settings monkeys with your whole setup, so I'd advise taking a Foundry backup (using Foundry's funky new built-in backups) until you're confident that it's working for you. Thanks @itsmegrave for the idea waaay back last year (#136)

## 7.4.1 (2023-08-21)

* Number input now work properly again when you type into them (#391) Thanks @muwak
* Esoterrorists abilities: "Scuffling" now spelled correctly, and Health and Stability now have a minimum value of -12 (#397) Cheers @AlbertG73

## 7.4.0 (2023-08-05)

* Updated German translations (#380) Cheers @muwak!

## 7.3.2 (2023-07-11)

* BUG FIX: Initiative values were sometimes not being remembered if you refreshed the page. Fixed. (#346)

## 7.3.1 (2023-07-01)

* BUG FIX: The NBA Languages ability now actually uses the custom logic added in 7.3.0. (#333)
* BUG FIX: When a GM refreshes an NPC, it no longer broadcasts a message (#330)

## 7.3.0 (2023-06-30)

An unexpected release, to be sure, but a welcome one.

* Special handling for Night's black agents Languages, where the number of specialities is not just the same as the number of ranks. (#240)
* Support for languages (specifically, Polish) in which the "name" for an object is not the same as the "name" for a person. Thanks @marksjus (#284)
* Esoterrorists is now supported in Babele translations, including Polish Thanks @marksjus (#278)
* BUG FIX: Newly-created world now have "Drive" as the single personal detail, as intended. (#273)
* BUG FIX: Some fixes for Esoterrorists abilities (#276)
* BUG FIX: Some themes looked like ASS in Chrome because yours truly only uses Firefox, and although I do perform browser testing I evidently hadn't used the affected themes in Chrome until now. Thanks @marksjus again for the report (#279)
* BTS: The automatic dependency updater had stopped working. It's now back online, so this release includes a bunch of package updates which shouldn't change anything outwardly.


## 7.2.1 (2023-06-22)

* Add Polish strings for "Moribund World" to the system manifest. WHOOPS.

## 7.2.0 (2023-06-22)

### Headlines

* **The Esoterrorists** Thanks to @tbsvttr for the ability compendium pack, we now have bnuilt-in support for The Esoterrorists, (#261) including...
* **New character sheet theme: Unsafe Reality**
* Fully updated Polish translations, thanks to @marksjus

### And also:

* The config presets are now all named correctly for the system, rather than the quirky trademark-dodging names they had before. (#270)

### Behind the scenes stuff that only front-end devs will care about:

* I've replaced Jest and tsd with [Vitest](https://vitest.dev/) as the test runner. This was motivated by Jest's config getting increasingly painful to maintain for the way INVESTIGATOR is set up. Vitest just grabs your Vite config and goes from there, so it's dead easy.


## 7.1.0 (2023-06-16)

* GUMSHOE now works with Foundry v11! (it kinda did before but with some bugs, which have now been fixed.) (#244)
* Polish translations have been added fixed and completed, thanks @marksjus  (#246)
* The combat tracker is now resizable when popped out (#143)
* When you refresh a PC's abilities, a message is broadcast to the chat log (#230)

And finally:

* As a result of sorting out some issues found while integrating the Polish translations, I realised that a whole bunch of translations that had been contributed to Transifex had not made their way into any release. APOLOGIES to the folks who had contributed those strings. They are now included in this release. (#251)


## 7.0.0 (2023-06-01)

### The Headlines

* 🎉🥳👌 **INVESTIGATOR has been reborn as the official GUMSHOE system for Foundry VTT.** Huge thanks to Ellen and Cat at Pelgrane for making this happen.
  * You will still see the string "investigator" here and there for technical reasons, but the system is now called "GUMSHOE".
* **Full ability compendiums!** The built-in packs now contain full lists of abilities for their respective games and settings. No more having to type them in yourself! (#242)

### Other stuff which is cool but not as cool as the above

* **Weapons now have a "cost" field.** This was needed for some game settings (#130).
* **Situational modifiers!** These are specific +/- modifiers that apply to abilities in certain situations, like "+1 while flying" or "-3 near water". You can check them on or off before making your ability test (#129).
* **BUG FIX: Abilities with diäčriţicałs in their names will now sort correctly.** Thanks to Vivien DE BONA for the fix, and marksjus for a bug report (#204 and #239).
* To celebrate the recent release of Foundry v11, **GUMSHOE is now fully compatible with Foundry v10.** Yes, you read that right. I will get busy with v11 testing next 😃 (#199)
* SMALL BUG FIX: The actor icon that appears in the chat bar is now correct for tokens actors that are not linked to a world actor (#203).
* Updates `es` and `pr-BR` translations from Musrha and Luiz Borges (#222 and #223)
* The occupation "subtitle" at the top of the character is now in sync with the occupation item. This matches how it used to be before we added occupation items. (#229)
* The font used for the NBA-related themes (Unica One) was hard to read, and has been replaced with Big Shoulders Text and Big Shoulders Display. Thanks @WillPlant#1676 (#243).
* Major version bump from 6 to 7 to celebrate the name change and the Foundry v10 full compatibility.

### BTS stuff of which I am very proud but should make little difference to users

* I've updated to **React 18**, which either means nothing to you, or is terribly exciting. If you're in the first group, please try to be excited on behalf of those of us in the second group (#154).
* The project has **switched back from GitLab to GitHub** (which is where it was back when it was called "Trail of Cthulhu for Foundry VTT" in 2020) This follows a general community shift away from GitLab, and also makes it easier for Pelgrane to be involved in the project (#156).
* Some really neat stuff with diff snapshot tests for the settings reducer. Again, please just nod and smile if this means nothing to you (#236).


## 6.2.0 (2023-03-08)

* A small release to introduce the optional ability to turn personal details back into text fields, like how they used to be.

## 6.2.0-beta.1 (2023-03-08)

* A small release to introduce the optional ability to turn personal details back into text fields, like how they used to be.

## 6.1.0 (2023-02-05)

Another "building block" release, with a big new feature that will make more sense further down the line.

* Big new feature: Personal Details. These replace the old "short notes" fields, which were just text boxes. "Personal Details" are a fully fledged item type, with images and text, which can be created, shared, put into compendium packs etc. Additionally, they can be linked to a compendium pack so that when you add the personal detail item to an actor, it can automatically add all the items in the compendium pack too! (#127)
* Small new feature: a visual indicator on the PC sheet when abilities are boosted (#146) Thanks P. Troilus for the idea.
* Small new feature: Boosted investigative abilities automatically restore 1 point after a spend. (#147) Thanks P. Troilus for the idea again.
* Bug fix: Regular players no longer see a spurious error message when the GM adds a non-player-controlled token to combat (#149) Thanks Inloy for the bug report.
* Bug fix: spend on attacks by NPCs without linked actor data now stick (#150) Thanks Rob Bush for the bug report.
* Bug fix: Using the built-in "save" button on the rich text editor actually saves the text now (#152) Thanks little old me for the bug report.

## 6.0.0 (2023-01-08)

* Equipment categories! The GM can now define "types" of equipment and named custom fields to be present for each type. For example, you might define "treasure" as a category, with a "value" field, and "tomes" with a "sanity cost". Tickets #128 and #64, in a pleasant binary rhyme. See the wiki at https://gitlab.com/n3dst4/investigator-fvtt/-/wikis/How-equipment-categories-work for full details, or come and say Hi in the Pelgrane discord server: https://discord.com/channels/692113540210753568/720741108937916518
* Bug fix: Images inserted in the rich text editor now show up correctly when the text is saved. Ticket #144.


## 6.0.0-beta-2 (2022-12-30)

* Bug fixes on equipment categories

## 6.0.0-beta-2 (2022-12-30)

* Updates minimum core Foundry version to 10.291

## 6.0.0-beta-1 (2022-12-30)

* Equipment categories! The GM can now define "types" of equipment and named custom fields to be present for each type. For example, you might define "treasure" as a category, with a "value" field, and "tomes" with a "sanity cost". Tickets #128 and #64, in a pleasant binary rhyme.
* Bug fix: Images inserted in the rich text editor now show up correctly when the text is saved. Ticket #144.

## 5.1.3 (2022-11-08)

* Fix #142 - the combat tracker should now be okay in v9 and v10. That thing is the absolute bane of my life.

## 5.1.2 (2022-09-02)

* Re-fix the combat sidebar in v10.

## 5.1.1 (2022-08-27)

* Fix a bug that stripped out custom fonts, if you're using the "Custom Fonts" module.
* Move the build and dev process to Vite. Gigantic thanks to the Lancer system devs for their write-up on this.

## 5.1.0 (2022-08-16)

* You can now remove the last item from all lists in settings except ability categories and combat abilities.
* You can now add and remove custom stats!
* The settings window has been given a small glow-up and now has tabs, which gives us more room to work with.

## 5.0.1 (2022-08-08)

* Typo in `minimumCoreVersion` 🤣

## 5.0.0 (2022-08-08)

* Drop support for FVTT 0.8.x.
* Various FVTT v10 compatibility fixes:
  * The combat tracker now looks right in FVTT v10.
  * Dropping actors onto the party sheets works in FVTT v10.
* Specialities with more than one word no longer get bunched up on the left.

## 4.12.0 (2022-06-12)

* A small release to include some new translations:
  * Polish (Core & SRD abilities)
  * Japanese (Core, SRD weapons, and Path of Cthulhu)

## 4.11.1 (2022-06-01)

* **Bug fix** New combat tracker show names, not IDs, now.
* **Bug fix** Ability specialities only show up once.
* **Bug fix** Double-clicking combatant now opens the actor sheet, like the standard combat tracker does.

## 4.11.1 (2022-06-01)

* **Bug fix** BIG WHOOPS. 4.11.0 incorrectly triggered an old migration which had the effect of wiping out actor notes and text fields. This version does not. Thanks to @Seamonster and Francesco Giorgi for reporting.

## 4.11.0 (2022-05-31)

* Presets, like themes, are now decoupled from the core system, so we can write modules which add support for new games.
* Numeric trackers can now be configured (instead of just having hard-coded hit threshold etc.) This is important for games which use other numeric counters which are not full abilities.
* The text shown when you don't have an occupation can now be configured. It used to be hard-coded as "Investigator" but can be anything, e.g. "Hero".
* The NPC sheet has a new layout.
* Unlockable talents - when you have more than a given number of ranks in an ability, show a badge indicating that a special talent has been unlocked.
* QoL tweaks to the "Edit" tab.
* New initiative tracker! No longer will you have to click an irrelevant d20 to "roll" initiative in Gumshoe.
* New *alternative* turn-passing combat tracker, for games which use "Popcorn"-style initiative.
* Various deprecation fixes.
* **Bug fix** Sheets now look right in Pop-Out (probably; this is the second time this has come up)

## 4.10.0 (2022-04-12)

* Basic testing against Foundry VTT v10. Seems okay to me so far?
* Character sheet themes are now decoupled from the main system, so you can:
  * Write Foundry modules that add themes to INVESTIGATOR, or
  * Throw some JSON in a folder in your local Foundry data to create a local theme!
* **Bug fix** The SRD ability "archaeology" was spelled "archeology" in the "Path of Cthulhu" compendium.

## 4.9.7 (2022-04-04)

* There was a bug in the way initiative order was being set that made it sometimes look as if it didn't work at all. Fixed now.
* Setting the actor icon sets the default token icon.
* Updated ES and CA translations (thank you!)
* New JA translations (thank you!!)

## 4.9.1 (2022-03-04)

* Minor fixes

## 4.9.0 (2022-03-03)

Happy March! A big list of updates today:

* **Tested against Foundry VTT v9.251**
* Several QoL improvements for Moribund World mode:
  * Better layout on the abilities page and items page
  * High-level items types (sandestins, manses, retainers)
  * Injury status
* The party sheet now lets you add missing abilities! This a really easy way to fill in abilities on characters when you're tinkering with your setup.
* Default images for PCs, NPCs, and parties.
* The party sheet now shows PC images.
* The party sheet now has a an editable image.
* **Bug fix** If a character is missing the relevant ability for a weapon, they can now do a simple +0 roll.
* **Bug fix** You can now click to open an ability from the party sheet directly in FVTT 9.x, as you could in 8.x.
* **Bug fix** The "Remove" buttons across the top of the party sheet now remove the right character.

## v4.8.0 (2021-12-31)

Happy new year! A big update.

* **Tested against Foundry VTT v9.238**
* **Rich text support!** All the places where previously we had plain-text notes areas, you can ow choose to edit as either rich text (using Foundry's standard rich text editor,) [Markdown](https://commonmark.org/help/) (if you're into that sort of thing), or plain text.
* Rules support for the **"Moribund World" system**, which is very similar to GUMSHOE but not quite.
* **The "Nuke" button is now hidden** unless you're using the [🧙 Developer Mode](https://foundryvtt.com/packages/_dev-mode) module.
* Speaking of which, [🧙 Developer Mode](https://foundryvtt.com/packages/_dev-mode) is now the preferred way to activate developer features.
* You can now set the **Initiative Ability** directly from the character sheet. This a great QoL feature, thanks to @yariv).
* German translations! Thanks to `@muwak` on Gitlab.
* **Bug fix** There were some missing translations around combat ordering. Fixed now.
* **Bug fix** The new chat messages from 4.7.0 could go weird if the relevant ability or weapon was removed. Fixed now.

## v4.7.1 (2021-11-01)

* Whoops
* Update `compatibleCoreVersion` in system manifest (#54)

## v4.7.0 (2021-11-01)

* **Improved chat messages** for spends, tests, and combat rolls (#26).
* **(Initial) Foundry v9.x compatibility** - seems okay but we will monitor as FVTT 9.x progresses (#54).
* Bug fix: there were some check boxes which were a bit laggy (#55).
* The Delta Groovy theme has had some polish (#56, #57).
* Behind-the-scenes code improvements (#53, #58).


## v4.6.0 (2021-10-20)

* **New "Play" and "Edit" tabs** (#41) Thanks to Yariv Yanay (@yariv on Discord, @yarrriv on GitLab). The main character sheet tab is now interactive and you can performs tests and spends directly from it instead of having to open the ability pop-up. There's also an "Edit" tab for rapid ability editing.
* **Behind the scenes** Two changes which won't be visible to the user, but which will affect development: 1. I've semi-automated pulling in translations from Transifex, so it'll be nice and easy to keep up to date with the translation contributions. 2. The way themes are authored has been completely refactored. This will bear fruit later.

## v4.5.0 (2021-10-04)

* **Casting the Runes** (#45) With thanks to The Design Mechanism, we have full support for [Casting the Runes](http://thedesignmechanism.com/Casting-the-Runes.php), the GUMSHOE-system RPG based on the works of M. R. James.
* **Brazilian Portuguese translations** (#46) Big thanks Diogo A Gomes.
* **Bug fix** The party matrix was broken if you had any non-ability compendium packs selected as default PC packs. Terribly sorry for any inconvenience etc., fixed now.

## v4.4.0 (2021-09-28)

* **New actor type and ability pack for NPCs!** (#5) Thanks to Yariv Yanay (@yariv on Discord, @yarrriv on GitLab). This closes one of the oldest feature requests.
* **Two new character sheet themes!** Delta Groovy and Green Triangle (#20)
* **Editable image for abilities and equipment!** (#28) Also the ability to view an image full size.
* **All GUMSHOE SRD v3 abilities in one handy pack!** (#22) Even the ones that aren't in other packs.
* **Babele translations for various packs!** (#40) Big thanks to @Simone [UTC +2]#6710 for patching Babele to allow systems to distribute translations.
* **Bug fix** Package size is down from 4.4MB to 1.4MB (#39)
* **Bug fix** Weapons and equipment can now be dragged out from the character sheet to the sidebar (#44)

## v4.3.0 (2021-09-16)

* **French translations!** Merci @algol.
* A compendium pack of default **SRD weapons** - thanks @yariv/@yarrriv
* **Editable hit threshold** on the character sheet (#24) - this is purely informative at this point but I have ideas about making combat rolls better.
* **Icons for weapons & equipment** (#27). Editable images for these (and abilities) is on the list for later.
* **Notes field on abilities** (#19) This has been asked for by a few people.
* Abilities can be marked as **"Goes first in combat"**, and they will always go before anyone using an ability which is not marked as "goes first in combat". This lets you have a Night's Black Agents-style "guns go first" rule.
* **SRD weapons pack!** Thanks to Yariv Yanay (@yariv on Discord, @yarrriv on GitLab)
* **Bug fix**: Longer translations were pushing the ability configuration dialog (and others) out of whack (#29)
* **Bug fix**: Various translation fixes (#32, #31, #30)
* **Bug fix**: game-icons.net is given due attribution in README (#37)

## v4.2.0 (2021-09-12)

* ***Beta Feature***: *Quick import and export of Item and Actor compendium packs, to facilitate sharing of home-brew ability packs. (#11)*
* **Spanish translations!** INVESTIGATOR officially works in Spanish now, thanks to Rigal (@apz024), David Montilla (@montver), and Isaac Perez (@rizzibukki) (#7).
* **Catalan translations!** INVESTIGATOR officially works in Catalan now, thanks to David Montilla (@montver) (#21).
* **Bug fix:** Initiative is now based on the selected "combat ordering" ability (this was a Foundry 0.8.x breaking change) (#15)
* **Bug fix:** Weapons which don't use ammo, no longer show an ammo count (#32).
* **Bug fix:** Newly created abilities now have the right icon and have a category set (another latent Foundry 0.8.x breaker.) (#18 and #23)

## v4.1.0 (2021-09-05)

* Feature: New checkbox to exclude an ability from the full refresh
* Feature: "24h refresh" abilities
* Bug fix: Refreshed abilities were not remembering their pool values between sessions.
* Bug fix: the built-in resource trackers were not updating correctly.
* Fix some translation issues.
* Remove a couple more deprecated Foundry API calls.

## v4.0.0 (2021-08-14)

* Drop compatibility for Foundry VTT < 0.8.0 :(
* Fix Deprecation warnings when running in Foundry VTT 0.8.0+ :)
* (Internal) switch from `foundry-pc-types` to the more up-to-date and complete
  `@league-of-foundry-developers/foundry-vtt-types`.
* Fix a bug where newly created characters' abilities were missing, duplicated,
  or weird.
* Fix some translation issues.

## v3.1.0 (2021-08-05)

* Remove non-SRD abilities

## v3.0.1 (2021-07-03)

* A couple of minor tweaks.

## v3.0.0 (2021-07-03)

* Move to "INVESTIGATOR" branding.
* Translations! Currently ony English is supported but we have a way to do others now.

## v2.5.0 (2021-06-26)

* FoundryVTT 0.8.8 compatible

## v2.4.0 (2021-06-04)

* FoundryVTT 0.8.6 compatible

## v2.3.0 (2021-05-16)

* FoundryVTT 0.8.3 compatible

## v2.2.0 (2021-04-12)

* Update FVTT compatibility to 0.8.1
* Some minor fixes on the party sheet

## v2.1.1 (2021-03-15)

* Quick patch release to include some minor theming tweaks I hadn't committed

## v2.1.0 (2021-03-15)

* Add themes and compendium packs for Fear Itself and Ashen Stars
* Add a Party Tracker, a matrix view of abilities in a party

## v2.0.1 (2021-02-26)

* Mainly practising my release process
* Fix for newly created abilities having the wrong icons
* Fix a possible bug when adding new characters

## v2.0.0 (2021-02-26)

* GUMSHOE for Foundry VTT is now re-launched separate from the previous Trail of Cthulhu system, which will go into maintenance mode with a strong recommendation that folks upgrade to this one.
* Skipping a version number and dropping the pre-release suffix. Version numbers are free!
* Launch this newly renamed GUMSHOE for Foundry VTT with support for Trail of Cthulhu (as taken from the previous incarnation) and Night's Black Agents.

## v1.0.0-alpha.4 (2021-02-19)

* FIX not being able to edit sidebar abilities.
* There is loads more on the way but we're past due for a bugfix on this.


## v1.0.0-alpha.3 (2021-02-07)

* FIX: #3 (users getting "user  lacks permission to update character" when someone else updates their own pools).
* Infrastructure stuff, mainly working out the best way to do releases.

## v1.0.0-alpha.2 (2021-01-31)

* First public release
* Character sheet for Trail of Cthulhu
* Abilities, with pools and refreshes
* Key ability trackers
* General ability tests
* Weapons with range-dependent damage
* Pool trackers

## v1.0.0-alpha.1

Unreleased
