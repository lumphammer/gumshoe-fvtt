# Stats Policy

## Why does INVESTIGATOR ask if it can share anonymous stats?

Because I want to know _how_ INVESTIGATOR is being used in the wild.

Unlike most Foundry systems, INVESTIGATOR is massively configurable, and gets used to play a huge range of games, including the ones I build in, and a whole load of homebrew setups. As a result, I only ever really hear about 1. bugs, and 2. missing features. I almost never hear about the parts that are working fine, and I have no idea which presets and options are actually popular.

Knowing this info will help to guide future development.

## What data is sent?

- A unique world id. This is not linked to anything else, it's just used to group the reports from a particular world.
- The version of INVESTIGATOR you're running.
- The version of Foundry you're running.
- The language you're using.
- The number of users (_not_ their usernames.)
- Some info about your GUMSHOE settings (e.g. preset, theme, customizations.)
- The other modules you're using, and their versions.

We also store the country that the report was sent from, but we don't retain the IP address.

## How can I opt out?

At any time, open GUMSHOE System Settings from the Foundry sidebar, navigate to Miscellaneous -> Usage stats, and turn off "Share anonymous usage stats".

## How and when is the data collected?

At most once per day, when the GM logs in, and _if_ they have consented, INVESTIGATOR sends a little JSON payload to a service running on Cloudflare. You can preview the payload before consenting to anonymous stats, or at any time in the GUMSHOE System Settings. These reports are aggregated in a database once a day. We drop the details of any modules that don't appear in Foundry's public module registry. The raw reports are help for 400 days.

## Who has access to the collected data?

- Me (Neil de Carteret).
- _Potentially_ anyone who works on INVESTIGATOR in an official capacity in future.
- Rights-holders for the games we support, such as Pelgrane Press, if they were to ask.

## Is AI used in processing the data/is the data fed into any LLMs?

No.

Some AI was used in generating the ingest code and the dashboard, but it doesn't go anywhere near the collected data.

## What is the data used for?

To peer into the dimly-lit world of "how people actually use this thing." For example:

- Do people ever use the "equipment categories" feature?
- Do people running Night's Black Agents stick with the default theme?
- What proportion of users are running a fully homebrewed game?

These are all facts that would really help me. And also it's just nice to know!
