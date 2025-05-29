import { getTranslated } from "./getTranslated";
import { assertGame } from "./utilities";

interface confirmADoodleDoArgs {
  message: string;
  confirmText: string;
  cancelText: string;
  confirmIconClass: string;
  values?: Record<string, string>;
  resolveFalseOnCancel?: boolean;
  translate?: boolean;
}

/**
 * Pop up a foundry confirmation box. Returns a promise that resolves `true`
 * when the user clicks the confirm button.
 * The default behaviour is to not resolve at all if the user clicks `cancel`,
 * sine most commonly you want to just do nothing, but if you specify
 * `resolveFalseOnCancel: true` it will resolve `false` in that case.
 */
export const confirmADoodleDo = ({
  message,
  confirmText,
  cancelText,
  confirmIconClass,
  values = {},
  resolveFalseOnCancel = false,
  translate = true,
}: confirmADoodleDoArgs) => {
  assertGame(game);
  const tlMessage = translate ? getTranslated(message, values) : message;
  const tlConfirmText = translate
    ? getTranslated(confirmText, values)
    : confirmText;
  const tlCancelText = translate
    ? getTranslated(cancelText, values)
    : cancelText;
  const promise = new Promise<boolean>((resolve) => {
    const onConfirm = () => {
      resolve(true);
    };
    const onCancel = () => {
      if (resolveFalseOnCancel) {
        resolve(false);
      }
    };
    const d = new foundry.applications.api.DialogV2({
      window: {
        title: "Confirm",
      },
      content: `<p>${tlMessage}</p>`,
      buttons: [
        {
          label: tlCancelText,
          callback: onCancel,
          icon: "fas fa-ban",
          action: "cancel",
          default: true,
        },
        {
          label: tlConfirmText,
          callback: onConfirm,
          icon: `fas ${confirmIconClass}`,
          action: "confirm",
        },
      ],
    });
    void d.render({ force: true });
  });
  return promise;
};
