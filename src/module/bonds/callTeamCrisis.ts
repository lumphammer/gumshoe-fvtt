// Foundry glue for a GM's call for a team crisis (Fall of DELTA GREEN,
// p. 046), from the party sheet: pick who was there, and post a card from
// which each of those Agents makes their own test.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import { DialogV2 } from "../../fvtt-exports";
import type { PartyActor } from "../actors/party";
import { isActiveCharacterActor } from "../actors/types";
import { serializeCrisisCall } from "./crisis";
import { toCrisisTeammate } from "./teamCrisis";

/**
 * Ask the GM who was there, all ticked to start with. Resolves the chosen
 * actor ids, or null if they cancel.
 */
async function pickMembersPresent(members: Actor[]): Promise<string[] | null> {
  // through the DOM, so actor names can't break out
  const content = document.createElement("div");
  const hint = document.createElement("p");
  hint.textContent = getTranslated("WhoWasThere");
  content.append(hint);
  for (const member of members) {
    const label = document.createElement("label");
    label.style.display = "block";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "member";
    checkbox.value = member.id ?? "";
    checkbox.setAttribute("checked", "");
    label.append(checkbox, ` ${member.name ?? ""}`);
    content.append(label);
  }
  const result: unknown = await DialogV2.wait({
    window: { title: getTranslated("TeamCrisis") },
    content: content.outerHTML,
    buttons: [
      {
        action: "cancel",
        label: getTranslated("Cancel"),
        icon: "fas fa-ban",
      },
      {
        action: "call",
        label: getTranslated("CallTeamCrisis"),
        icon: "fas fa-bolt",
        default: true,
        callback: (_event, button) =>
          [
            ...(button.form?.querySelectorAll<HTMLInputElement>(
              "input[name=member]:checked",
            ) ?? []),
          ].map((input) => input.value),
      },
    ],
  });
  return Array.isArray(result) ? (result as string[]) : null;
}

/**
 * Call a team crisis for a party: pick who was there, and post a card with a
 * button for each Agent to make their test.
 */
export async function callTeamCrisis(party: PartyActor): Promise<void> {
  const members = party.system
    .getActors()
    .flatMap((actor) => (isActiveCharacterActor(actor) ? [actor] : []));
  const ids = await pickMembersPresent(members);
  if (ids === null) {
    return;
  }
  const present = members.filter((member) => ids.includes(member.id ?? ""));
  // nobody can bond with nobody
  if (present.length < 2) {
    ui.notifications?.warn(getTranslated("ACrisisNeedsAtLeastTwo"));
    return;
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: party as Actor.Stored }),
    content: buildAbilityCardContent({
      [constants.htmlDataMode]: constants.htmlDataModeBondCrisisCall,
      [constants.htmlDataImageUrl]: party.img,
      [constants.htmlDataBondCrisisCall]: serializeCrisisCall({
        members: present.map(toCrisisTeammate),
      }),
    }),
  });
}
