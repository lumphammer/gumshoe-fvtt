import { assertGame } from "../functions/isGame";

export const installDSNFix = async () => {
  assertGame(game);
  // turn off simultaneous rolls for DSN

  // simone's version from the docs.
  // See https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/wikis/Integration
  if (
    game.settings.settings.has("dice-so-nice.enabledSimultaneousRollForMessage")
  ) {
    await game.settings.set(
      "dice-so-nice",
      "enabledSimultaneousRollForMessage",
      false,
    );
  }

  // the one that actually exists:
  if (game.settings.settings.has("dice-so-nice.enabledSimultaneousRolls")) {
    await game.settings.set("dice-so-nice", "enabledSimultaneousRolls", false);
    await game.settings.set("core", "animateRollTable", true);
  }
};
