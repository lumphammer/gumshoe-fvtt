import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/utilities";
import { investigatorSettingsClassInstance } from "../module/SettingsClass";

export const installRenderSettingsHandler = () => {
  Hooks.on("renderSettings", (app: Application, html: JQuery) => {
    assertGame(game);
    const canModifySettings = game.user.can("SETTINGS_MODIFY") ?? false;
    if (!canModifySettings) {
      return;
    }
    const systemNameTranslated = getTranslated("SystemName");
    const text = getTranslated("SystemNameSystemSettings", {
      SystemName: systemNameTranslated,
    });
    const button = $(`<button><i class="fas fa-search"></i>${text}</button>`);
    html.find('button[data-action="configure"]').after(button);

    button.on("click", (ev) => {
      ev.preventDefault();
      investigatorSettingsClassInstance.render(true);
    });
  });
};
