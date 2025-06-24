import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/isGame";
import { ApplicationV2 } from "../fvtt-exports";
import { investigatorSettingsClassInstance } from "../module/SettingsClass";

export const installRenderSettingsHandler = () => {
  Hooks.on("renderSettings", (app: ApplicationV2, html: HTMLElement) => {
    assertGame(game);
    const canModifySettings = game.user.can("SETTINGS_MODIFY") ?? false;
    if (!canModifySettings) {
      return;
    }
    const systemNameTranslated = getTranslated("SystemName");
    const text = getTranslated("SystemNameSystemSettings", {
      SystemName: systemNameTranslated,
    });
    const button = document.createElement("button");
    button.innerHTML = `<i class="fas fa-search"></i>${text}`;
    html.querySelector('button[data-app="configure"]')?.after(button);

    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      void investigatorSettingsClassInstance.render({ force: true });
    });
  });
};
