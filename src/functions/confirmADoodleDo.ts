import { getTranslated } from "./getTranslated";
import { assertGame } from "./utilities";

interface confirmADoodleDoArgs {
  message: string;
  confirmText: string;
  cancelText: string;
  confirmIconClass: string;
  values?: Record<string, string | number>;
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
    const d = new Dialog({
      title: "Confirm",
      content: `<p>${tlMessage}</p>`,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-ban"></i>',
          label: tlCancelText,
          callback: onCancel,
        },
        confirm: {
          icon: `<i class="fas ${confirmIconClass}"></i>`,
          label: tlConfirmText,
          callback: onConfirm,
        },
      },
      default: "cancel",
    });
    d.render(true);
  });
  return promise;
};
