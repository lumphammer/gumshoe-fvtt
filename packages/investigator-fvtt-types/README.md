# @lumphammer/investigator-fvtt-types

This package contains TypeScript types for people wishing to write custom addons for [INVESTIGATOR for Foundry VTT][investigator].

Currently this includes types for

* creating and registering themes
* creating and registering system presets

## Styles and Emotion

The style types (`CSSObject` and friends) are copies of Emotion 11's, built on
[`csstype`](https://github.com/frenic/csstype), so a theme written with
Emotion can pass its styles to us and ours to Emotion. `csstype` is a peer
dependency: install it alongside (`npm install csstype`), and if you use
Emotion, make sure it and this package resolve the same `csstype` (deduplicate
it), because different `csstype` versions make the two `CSSObject`s
incompatible. You don't need Emotion itself.

## Release process

1. Make sure everything is committed.
2. `npm version {major,minor,patch}`.
3. `git push`.
4. `npm publish`.

[investigator]: https://gitlab.com/n3dst4/investigator-fvtt
