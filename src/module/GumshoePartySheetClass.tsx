// import ReactDOM from "react-dom";
import React from "react";
import { GumshoePartySheet } from "../components/party/GumshoePartySheet";
import { reactTemplatePath, systemName } from "../constants";
import { ReactApplicationMixin } from "./ReactApplicationMixin";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class GumshoePartySheetClassBase extends ActorSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: [systemName, "sheet", "actor"],
      template: reactTemplatePath,
      width: 660,
      height: 900,
    });
  }
}

const render = (sheet: GumshoePartySheetClassBase) => {
  return (
    <GumshoePartySheet
      party={sheet.document}
      foundryApplication={sheet}
    />
  );
};

export const GumshoePartySheetClass = ReactApplicationMixin(
  GumshoePartySheetClassBase,
  render,
);
