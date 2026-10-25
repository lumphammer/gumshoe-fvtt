# Network contacts: implementation plan

Fall of DELTA GREEN's Network ability (p. 068), which Night's Black Agents
shares, so it's a general feature with a configurable ability name. See also
[`fodg-preset.md`](fodg-preset.md).

## Rules as we read them

- At any time, an Agent can reveal a contact: someone in a given place who
  owes them favours. The contact gets a pool of points taken from the Agent's
  unassigned Network pool.
- A contact acts (finding guns or safe houses, papers, a way across a border)
  with a test of their own pool against a Difficulty, which the GM sets by
  jurisdiction. Only the contact's own points go into it.
- Tapping a contact for information costs 1 point from their pool, or 2 for a
  mother lode. Core clues are free.
- Points with a contact stay there, and don't refresh. When the pool is gone,
  so are the favours.
- Network refreshes at the end of an operation, but only up to its rating
  less what contacts still hold: unassigned pool plus contact pools equals the
  rating. So with Network 5, a contact given 3 (pool now 2) and tapped twice
  (contact now 1), the refresh gives back 2, to 4.
- More points can be given to an existing contact later. It's not quite the
  book's intent, but the player could just as well remember the contact's
  twin, who does the same job in the same town.

## Settings

Exportable, part of the preset format, off by default, on for FoDG:

| Key | Label | Default |
| --- | --- | --- |
| `useNetworkContacts` | Use Network contacts? | false |
| `networkAbility` | Name of Network ability | Network |

On a "Network contacts" page under Abilities.

The FoDG preset drops its "Contacts" long note (it hasn't been released).

## Data

A `networkContact` Item type, for PCs:

- name: who the contact is
- `location`: string, the city, firebase or the like
- `pool`: integer, at least 0
- `notes`: HTML

## Rules code

Pure functions in `src/module/contacts/rules.ts`:

- the Network refresh target: rating less the contacts' pools, at least 0
- how many points can be assigned: up to Network's pool
- the chat card record (assign, test or information), serialised into the
  card, like the Bond cards

Foundry glue in `src/module/contacts/contactActions.ts`:

- assign points from Network to a contact
- test a contact (spend from their pool, roll a d6)
- tap a contact for information (1 or 2 points)

Each posts a chat card carrying its whole record, so it reads the same after
the contact is renamed or deleted.

## Refreshes

Abilities get a refresh target: their rating, except for the Network ability
of a PC with contacts on, where it's the rating less the contacts' pools.
Full Refresh, the 24h refresh and an ability's own refresh button all use it.

Deleting a contact frees their points at the next refresh, which falls out
of the rule above.

## UI

- A **Contacts** tab on the PC sheet, after Bonds, when contacts are on:
  Network's pool (and what contacts hold), a "New contact" button, and a row
  per contact (name, location, pool) which opens the contact's sheet.
- The **contact sheet**: name, location, the pool (with what's left in
  Network), giving more points from Network, acting (a spend, and a Test
  button on its own row), tapping for information (1 or 2 points), and
  notes. The buttons are off when there aren't the points for them.
- The sheet's settings page has "Manually adjust pool", for the GM's fixes,
  which doesn't touch Network.
- "New contact" makes a contact with no points and opens its sheet, where
  points are assigned like a top-up.
- The contact item's icon is `rotary-phone.webp`. Earlier releases used
  Foundry's `mystery-man.svg` as a stand-in, which the
  `setNetworkContactIcon` migration replaces.
