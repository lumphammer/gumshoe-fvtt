import { escape } from "html-escaper";

import * as constants from "../../constants";
import { isNPCActor } from "../../module/actors/npc";
import { isPCActor } from "../../module/actors/pc";

export const upgradeLongNotesToRichText = (actor: Actor, updateData: any) => {
  let updateNeeded = false;
  if (isPCActor(actor)) {
    const newLongNotes: any[] = [];
    for (const note of actor.system.longNotes) {
      if (typeof note === "string") {
        updateNeeded = true;
        newLongNotes.push({
          format: "plain",
          source: note,
          html: escape(note),
        });
      } else {
        newLongNotes.push(note);
      }
    }
    if (updateNeeded) {
      if (!updateData.system) {
        updateData.system = {};
      }
      updateData.system.longNotesFormat = "plain";
      updateData.system.longNotes = newLongNotes;
    }
  }
  if (isNPCActor(actor)) {
    if (typeof actor.system.notes === "string") {
      if (!updateData.system) {
        updateData.system = {};
      }
      updateData.notes = {
        format: "plain",
        source: actor.system.notes,
        html: escape(actor.system.notes),
      };
    }
  }
  return updateData;
};

const MINUS_LIKE_A_BILLION = -1_000_000_000;

export const moveStats = (actor: any, updateData: any) => {
  if (
    (actor.type === constants.pc || actor.type === constants.npc) &&
    actor.system.hitThreshold !== MINUS_LIKE_A_BILLION
  ) {
    if (!updateData.system) {
      updateData.system = {};
    }
    if (!updateData.system.stats) {
      updateData.system.stats = {};
    }
    updateData.system.stats.hitThreshold = actor.system.hitThreshold;
    updateData.system.stats.armor = actor.system.armor;
    updateData.system.stats.alertness = actor.system.alertness;
    updateData.system.stats.stealth = actor.system.stealth;
    updateData.system.stats.stabilityLoss = actor.system.stabilityLoss;
    updateData.system.hitThreshold = MINUS_LIKE_A_BILLION;
  }
};
