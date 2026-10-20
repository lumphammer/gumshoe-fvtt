# Fall of DELTA GREEN preset

What the built-in *Fall of DELTA GREEN* preset contains, how it was checked
against the book, and what's still missing before we can claim full support.
Combat rules are covered separately in
[`fodg-combat-plan.md`](fodg-combat-plan.md).

Page references are to the *Fall of DELTA GREEN* corebook.

**Licensing:** we can ship ability names and game numbers (ratings, damage,
Lethality), but not the book's descriptive text. Ability and weapon notes are
deliberately empty; don't paste text from the book into packs, docs, issues or
PRs.

## What's in it

### Preset (`fallOfDeltaGreenPreset`, `src/presets.ts`)

- Theme: `deltaGroovyTheme`.
- Investigative categories: Academic, Interpersonal, Technical (shown even
  when empty, because every investigative ability hides at rating 0).
- Combat abilities: Unarmed Combat, Melee Weapons, Firearms, Heavy Weapons,
  Fighting (animals and monsters use Fighting, p. 089).
- Occupation label "Department"; generic occupation "Agent".
- Personal details: Military Service (item), Motivation (text).
- Long notes: Service Record/Bio, Bonds, Disorders, Contacts, Notes.
- PC and NPC stats: the same as Trail of Cthulhu (Hit Threshold; plus Armor,
  Alertness, Stealth and Stability Loss for NPCs), which match the book's stat
  blocks.
- All the FoDG combat options are on. Walking fire spends Athletics; full-auto
  spends Athletics and Stability (p. 106).

### Packs

| Pack                                | Contents                                                         |
| ----------------------------------- | ---------------------------------------------------------------- |
| `fallOfDeltaGreenAbilities`         | The 62 PC abilities; added to new PCs                            |
| `fallOfDeltaGreenOpponentAbilities` | Athletics, Health, the four combat abilities, Fist/kick; new NPCs |
| `fallOfDeltaGreenWeapons`           | 28 generic weapons                                               |

**PC abilities** (started from a user-made pack, then checked against the
book):

- 13 Academic, 11 Interpersonal and 14 Technical investigative abilities
  (p. 023), the 23 general abilities (p. 024), plus Hypergeometry.
- Free ratings: Agency 2, Athletics 2, Bureaucracy 2, Health 4, Network 5,
  Sanity 5, Stability 4 (p. 020).
- Specialities on Art, Foreign Language, Drive and Pilot (one per rating
  point).
- Refreshes (p. 126, and the summary on p. 355):
  - The seven physical abilities (Athletics, Drive, Firearms, Heavy Weapons,
    Melee Weapons, Pilot, Unarmed Combat) refresh daily *and* with the main
    refresh.
  - Health, Stability and Sanity are excluded from the main refresh.
  - Bureaucracy and Network refresh at the end of an operation (the main
    refresh).
- Health and Stability go down to −12 (Hurt/Shaken at 0 to −5,
  Seriously Wounded/Shattered at −6 to −11). Sanity stops at 0.
- Health, Stability and Sanity are explicitly linked to their resources, so
  token bars sync both ways.
- All general abilities can be used investigatively (p. 063) except Health,
  Sanity and Stability.
- Every investigative ability, and Hypergeometry, hides at rating 0.

**Opponent abilities:** the shared `opponentAbilities` pack gives NPCs
Scuffling and Shooting, which don't exist in FoDG. This pack replaces it for
the preset. Ratings start at 0. The combat abilities hide in play mode until
rated, so humans don't show Fighting and monsters don't show Firearms.

**Weapons:** the book has no weapon catalogue, only generic categories, so
the pack follows the damage table (p. 092), the Lethality table (p. 094) and
the range rules (p. 097):

- Firearms do +2 at Point-Blank. Shotguns are heavy at Point-Blank, +1 at
  Close, light at Near, and have no Long range.
- Assault rifles and SMGs are selective fire. Machine guns use Heavy Weapons,
  always fire full-auto, and carry their own Lethality (light L1\*, heavy L2).
- Grenades are thrown with Athletics (hand L1\*, white phosphorus L1). The
  grenade launcher uses Firearms (L1\*, Close to Long); the rocket launcher
  uses Heavy Weapons (L2).
- Everything that fires bullets is marked as gunfire and uses the
  `bullets.webp` icon. The crossbow uses Firearms (p. 066) but isn't a
  firearm for damage.

The weapons and opponent packs were generated once by a throwaway script;
they're ordinary packs now, so edit them in Foundry and run `extract-packs`.

## Decisions and interpretations

- **Ammo capacities** aren't in the book. We picked: pistols 7–8, rifles and
  shotguns 5, assault rifle 20, SMG 30, machine guns 100, two grenades, one
  shot for launchers.
- **Extended Range** (p. 098): pistols and SMGs can be fired at Long range,
  but the 2-point spend doesn't add to the roll, which the system can't
  express. Players deduct it by hand.
- **Not modelled:** grenade difficulty by range, Heavy Weapons landing
  difficulty, blast and debris ranges, special ammunition.
- **Agency** (p. 052) is really one ability per named agency, each with its
  own pool. Players rename it ("Agency (CIA)") and add another Agency item for
  a second agency.
- **Ride** gains an animal per 2 points, which the speciality modes can't
  express, so it has no specialities.

## Gaps

Rough priority order.

1. **Bonds** (pp. 045–046, 120, 128): done, see
   [`fodg-bonds-plan.md`](fodg-bonds-plan.md). Spending, burning,
   rebuilding, establishing, DELTA GREEN Bonds after a team crisis, and
   adapting to trauma. Not covered: Bonds lost when the person dies or goes
   permanently insane, and the other Personal Life vignettes.
2. **Stability states** (p. 113): done, see
   [`fodg-stability-plan.md`](fodg-stability-plan.md). Shaken, Shattered and
   Gone as statuses, Shaken's effects (asking before Investigative spends, a
   reminder of +1 Difficulty: #1428), and Stability tests against trauma.
3. **Sanity** (pp. 070, 121–122): the cap (10 minus The Unnatural) is done,
   see [`stability-settings-plan.md`](stability-settings-plan.md). The rest
   is left to the table: the book's rules are vague enough that tables will
   house-rule them. So Sanity can still be tested and spent, the GM turns an
   Agent at 0 into a GMC by hand, and the revelation table (p. 121) is a
   guideline rather than options on the sheet.
4. **Network contacts** (p. 068). Each contact gets a pool carved out of
   Network, and those points never refresh.
5. **Initiative** (p. 090). The book orders ready weapons first, then guns
   before melee, then by rating, with ties broken by pool. The system ranks
   by one ability's rating, and the GM reorders by hand.
6. **Hit Threshold 4 at Athletics 8+** (p. 090). Shared with other GUMSHOE
   games, so it could be a general feature.
7. Lower priority:
   - Special Training and Special Weapons Training (pp. 072–073).
   - Hypergeometry capped by Hypergeometric Potential (p. 197).
   - Adaptation to Violence or Helplessness (p. 120): done (see
     `fodg-bonds-plan.md`, phase 6, and `fodg-stability-plan.md`), except
     the extra Stability lost to Stress Penalties.
   - Chargen checks: investigative build points by group size (p. 020);
     second-highest general ability at least half the highest (p. 024).
   - Personal Life vignettes and campaign modes (pp. 128–130).
   - Psychic powers (p. 198).
   - More personal details from the paper sheet (p. 347), e.g.
     "Special Training", "Inciting Event".

## Open questions

- Which of the gaps above to file as issues, and which to work on next.
- Whether any of the decisions above (ammo numbers, Extended Range, Agency,
  Ride) should change.
