// The GM's prompt for a Difficulty, when a player asks for one before rolling

import { getTranslated } from "../../functions/getTranslated";
import { DialogV2 } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import { getStabilityStateName } from "../stability/settings";
import type { AbilityTestMessage } from "./AbilityTestMessageModel";
import { editAbilityTest } from "./editAbilityTest";
import { difficultyChoices, standardDifficulty } from "./outcome";

/** one prompt per request */
const openDialogs = new Map<string, DialogV2>();

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * The prompt's content. Built through the DOM, because the names in it are
 * user-supplied.
 */
function buildContent(message: AbilityTestMessage): string {
  const { abilityName, spend, bondSpends, difficultyModifiers } =
    message.system;
  const wrapper = element("div");
  wrapper.append(
    element(
      "p",
      getTranslated("ActorNameIsTestingAbilityName", {
        ActorName: message.alias,
        AbilityName: abilityName,
      }),
    ),
  );
  const spends = [
    `${abilityName} ${spend}`,
    ...bondSpends.map(({ name, spend }) => `${name} ${spend}`),
  ];
  wrapper.append(
    element("p", `${getTranslated("Spent")}: ${spends.join(", ")}`),
  );
  for (const modifier of difficultyModifiers) {
    wrapper.append(
      element(
        "p",
        getTranslated("StateDifficultyReminder", {
          State: getStabilityStateName(modifier.state),
          Penalty: String(modifier.amount),
        }),
      ),
    );
  }
  const label = element("label");
  label.className = "form-group";
  label.append(element("span", getTranslated("Difficulty")));
  const select = element("select");
  select.name = "difficulty";
  // if the default is to ask, start from the usual
  const defaultDifficulty =
    settings.defaultTestDifficulty.get() ?? standardDifficulty;
  for (const difficulty of difficultyChoices(defaultDifficulty)) {
    const option = element("option", String(difficulty));
    option.value = String(difficulty);
    // the attribute, not the property: this is serialised
    option.defaultSelected = difficulty === defaultDifficulty;
    select.append(option);
  }
  label.append(select);
  wrapper.append(label);
  return wrapper.outerHTML;
}

/**
 * Ask the GM for the Difficulty of a requested test. Closing the prompt
 * leaves the request waiting: the GM can answer it from its card.
 */
export function askForDifficulty(message: AbilityTestMessage): void {
  const id = message.id ?? "";
  if (openDialogs.has(id)) return;
  const dialog = new DialogV2({
    window: { title: getTranslated("SetADifficulty") },
    content: buildContent(message),
    buttons: [
      {
        action: "roll",
        label: getTranslated("Roll"),
        icon: "fas fa-dice",
        default: true,
        callback: (_event, button) => {
          const select = button.form?.elements.namedItem("difficulty");
          const base =
            select instanceof HTMLSelectElement ? Number(select.value) : NaN;
          if (Number.isInteger(base)) {
            void editAbilityTest(message, { kind: "roll", base });
          }
        },
      },
      {
        action: "rollWithout",
        label: getTranslated("Roll without a Difficulty"),
        icon: "fas fa-dice-d6",
        callback: () => {
          void editAbilityTest(message, { kind: "roll", base: null });
        },
      },
      {
        action: "cancel",
        label: getTranslated("Cancel test"),
        icon: "fas fa-ban",
        callback: () => {
          void editAbilityTest(message, { kind: "cancel" });
        },
      },
    ],
  });
  openDialogs.set(id, dialog);
  dialog.addEventListener("close", () => openDialogs.delete(id));
  void dialog.render({ force: true });
}

/** Close the prompt for a request which has been settled some other way */
export function closeDifficultyPrompt(messageId: string): void {
  void openDialogs.get(messageId)?.close();
}
