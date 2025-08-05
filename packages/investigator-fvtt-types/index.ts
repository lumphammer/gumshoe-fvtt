import { CSSObject, SerializedStyles } from "@emotion/react";
export { CSSObject } from "@emotion/react";

/**
 * Essential colors for a theme. Some are typed as optional. If these are left
 * out they will be inferred from the others.
 */
export interface SeedColorsV1 {
  /**
   * callout color for clickable text and other "hot" items
   */
  accent: string;
  /**
   * when `accent is used as a background, this color should work as text over
   * it
   */
  accentContrast: string;
  /**
   * used for hover effect on hot items
   */
  glow: string;
  /**
   * tinting color used to indicate danger. Should be given as a bold, opaque
   * color, but may be blended in use.
   * @default red
   */
  danger?: string;
  /**
   * tinting color used to indicate success. Should be given as a bold, opaque
   * color, but may be blended in use.
   */
  success?: string;
  /**
   * flat color to stand in as the background before images have loaded
   */
  wallpaper: string;
  /**
   * basic non-interactive text color
   */
  text: string;
  /**
   * background for buttons
   */
  backgroundButton: string;
  /**
   * The contract for this color is: if you layer this color over the
   * `rootElementStyle` or the `wallpaper` color, you will get a surface which
   * can be used for text in either the `text` or `accent` colors.
   */
  backgroundPrimary: string;

  /**
   * The contract for this color is
   * 1. the same as backgroundPrimary but should look less prominent (will be
   * used for inactive tabs)
   * 2. can also be layered *on top of* backgroundPrimary to create a
   * secondary panel
   * @see {@link backgroundPrimary}
   */
  backgroundSecondary: string;

  /**
   * Color used to outline controls
   * @default text
   */
  controlBorder?: string;
}

/**
 * A theme definition for INVESTIGATOR
 */
export interface ThemeSeedV1 {
  schemaVersion: "v1";
  /** The name of the theme. Use puns and allusions liberally. */
  displayName: string;
  /**
   * CSS block which will be inserted at the top of the browser document. This
   * is a good place for `@import` directives for loading fonts, e.g.
   *
   * ```
   * global: css`
      import url('https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&display=swap');
    `,
   * ```
   *
   * (That `import` should have an @-sign in front of it but it messes with the
   * comment syntax.)
   */
  global?: SerializedStyles | string;
  /**
   * Will be applied to the root element of the themed area. This is a good
   * place to apply a wallpaper image. It is assumed that any window using this
   * style will always layer `backgroundPrimary` or `backgroundSecondary` over
   * it before adding text.
   */
  largeSheetRootStyle: CSSObject;
  /**
   * Will be applied to the root element of the themed area. This is a good
   * place to apply a wallpaper image. Unlike `largeSheetRootStyle`, text might
   * be applied directly onto this background. This is a good place to adjust
   * the background to make it directly usable.
   * @default largeSheetRootStyle
   */
  smallSheetRootStyle?: CSSObject;
  /**
   * These styles will be added to the app window for any <CSSReset>
   * unless `noStyleAppWindow` is given.
   */
  appWindowStyle?: CSSObject;
  /**
   * Classname to be added to active tabs
   */
  tabClass?: string;
  /**
   * Base style for tabs
   */
  tabStyle?: CSSObject;
  /**
   * Will be applied to active tabs
   */
  tabActiveStyle?: CSSObject;
  /**
   * Object placed between tabs. This is a good place to add a border for the
   * "top" of the content container
   */
  tabSpacerStyle?: CSSObject;
  /**
   * Styles for the main content area of a tab
   */
  tabContentStyle?: CSSObject;
  /**
   * Classname that will be applied to all panels
   */
  panelClass?: string;
  /**
   * Styles for primary panels
   */
  panelStylePrimary?: CSSObject;
  /**
   * Styles for secondary panels
   */
  panelStyleSecondary?: CSSObject;
  /**
   * Font string for block text.
   */
  bodyFont?: string;
  /**
   * Font string for title or label text.
   */
  displayFont?: string;
  /**
   * Styles for the fancy character sheet logo. See the LogoEditable component
   * for details.
   */
  logo: {
    /**
     * This number is used when working out how to scale the lettering in the
     * character sheet logo. The default is 14,
     * @default 14
     */
    fontScaleFactor?: number;
    /**
     * These styles will be applied individually to the front text elements, so
     * you can do the `background-clip: text; color: transparent;` trick to get
     * gradient (or other image) text.
     */
    frontTextElementStyle: CSSObject;
    /**
     * These styles will be applied to the div that wraps both front text
     * elements. This is a place to apply styles which need to "encompass" both
     * elements, e.g. a border.
     */
    frontTextElementWrapperStyle?: CSSObject;
    /**
     * These styles will be applied to the rear text element. This is a good
     * place to add drop shadows because if you put them on the front element
     * while doing the `background-clip: text; color: transparent;` trick the
     * shadow will show through the text 🥺
     */
    rearTextElementStyle: CSSObject;
    /**
     * These styles will be applied to the div that wraps both rear text
     * elements. This is a place to apply styles which need to "encompass" both
     * elements, e.g. a border.
     */
    rearTextElementWrapperStyle?: CSSObject;
    /**
     * These styles will be applied to both text elements at once (actually to a
     * wrapper around them. This is a good place to apply `transform`s.
     */
    textElementsStyle: CSSObject;
    /**
     * These styles will be applied to the otherwise-empty div that goes behind
     * the text elements.
     */
    backdropStyle: CSSObject;
  };
  /**
   * Styles that apply to cards
   */
  cards?: {
    /**
     * Styles that apply to all cards
     */
    base?: Partial<CardStyles>;
    /**
     * Styles that apply to the area containing cards
     */
    area?: Partial<CardsAreaStyles>;
    /**
     * Styles that apply to specific card categories
     */
    categories?: Record<string, Partial<CardStyles>>;
  };

  /**
   * All the values in this collection should be parseable as CSS colors
   */
  colors: SeedColorsV1;

  notesCssClasses?: {
    scopingContainer?: string;
    pcNote?: string;
    npcNote?: string;
    itemNote?: string;
  };
}

export interface CardsAreaStyles {
  /** Horizontal spacing between cards */
  horizontalSpacing: string;
  /** Vertical spacing between cards */
  verticalSpacing: string;
}

/** Styles for a card */
export interface CardStyles {
  /** The style for the card itself */
  backdropStyle: CSSObject;
  /** The style for the bit of text above the main card content */
  supertitleStyle: CSSObject;
  /** The style for the title of the card */
  titleStyle: CSSObject;
  /** The style for the subtitle of the card */
  subtitleStyle: CSSObject;
  /** The style for the content of the card */
  descriptionStyle: CSSObject;
  /** The style for the effect of the card */
  effectStyle: CSSObject;
  /** Styles applied when hovering over the card */
  hoverStyle: CSSObject;
}

/**
 * A definition for a countable value that all PCs or NPCs will have
 */
export interface Stat {
  min?: number;
  max?: number;
  default: number;
  name: string;
}

export type EquipmentFieldMetadata = {
  name: string;
} & (
  | {
      type: "string";
      default: string;
    }
  | {
      type: "number";
      default: number;
      min?: number;
      max?: number;
    }
  | {
      type: "checkbox";
      default: boolean;
    }
);

export interface EquipmentCategory {
  name: string;
  fields: Record<string, EquipmentFieldMetadata>;
}

export type PersonalDetailType = "text" | "item";

export interface PersonalDetail {
  name: string;
  type: PersonalDetailType;
}

export interface PresetV1 {
  schemaVersion: "v1";
  /** The name that this preset will appear as in the Foundry UI */
  displayName: string;
  /**
   * The id of the theme to use. If you are registering a custom theme, it
   * should match the id you used.
   */
  defaultThemeName: string;
  /**
   * Categories for investigative abilities, e.g. "Academic", "Interpersonal"
   */
  investigativeAbilityCategories: string[];
  /**
   * Categories for general abilities. For many systems, this will just be
   * "General".
   */
  generalAbilityCategories: string[];
  /**
   * List of ability names that can be used in combat.
   * This may be removed in future in favour or just flagging abilities as
   * "combat usable".
   */
  combatAbilities: string[];
  /**
   * What do we call the main, short descriptive text for a PC in this system?
   */
  occupationLabel: string;
  /**
   * What personalDetails do we need?
   * This replaces the old shortNotes config.
   */
  personalDetails?: PersonalDetail[];
  /**
   * What groups of notes to we need per character?
   */
  longNotes: string[];
  /**
   * What compendium packs should be automatically added to new PCs
   */
  newPCPacks: string[];
  /**
   * What compendium packs should be automatically added to new NPCs
   */
  newNPCPacks: string[];
  /**
   * Can abilities be boosted in this system?
   */
  useBoost?: boolean;
  /**
   * What string to use when a PC's occupation is empty
   * Defaults to "Investigator"
   */
  genericOccupation: string;
  /**
   * Should empty investigative categories be shown? Default is yes, because
   * in most GUMSHOE games, characters will have a smattering of abuilities
   * across all the categories. But in some, the categories represent
   * professional specialisations and you don't want to see e.g. Warrior
   * abilities on your Sorceror sheet.
   */
  showEmptyInvestigativeCategories?: boolean;
  /**
   * Ignore this unless you are doing something based on the DERPG  system.
   */
  useMwStyleAbilities?: boolean;
  /**
   * Ignore this unless you are doing something based on the DERPG  system.
   */
  mwHiddenShortNotes?: string[];
  /**
   * Ignore this unless you are doing something based on the DERPG  system.
   */
  mwUseAlternativeItemTypes?: boolean;
  /**
   * Ignore this unless you are doing something based on the DERPG  system.
   */
  useMwInjuryStatus?: boolean;
  /**
   * What stats should PCs have?
   */
  pcStats: Record<string, Stat>;
  /**
   * What stats should NPCs have?
   */
  npcStats: Record<string, Stat>;
  /**
   * Do NPCs get fix bonuses on combat abilities?
   */
  useNpcCombatBonuses?: boolean;
  /**
   * Use turn-passing initiative, AKA popcorn or lancer-style.
   */
  useTurnPassingInitiative?: boolean;
  /**
   * What standard categories do we have for equipment?
   */
  equipmentCategories?: Record<string, EquipmentCategory>;
  /**
   * Should we use cards?
   */
  useCards?: boolean;
  /**
   * What categories do we have for cards?
   */
  cardCategories?: CardCategory[];
}

/**
 * Type for the global CONFIG.Investigator
 */
interface InvestigatorConfig {
  /**
   * Install a theme.
   */
  installTheme: (id: string, seed: ThemeSeedV1) => void;
  /**
   * Install a preset.
   */
  installPreset: (id: string, preset: PresetV1) => void;
}

export interface HasId {
  id: string;
}

export interface CardCategory extends HasId {
  singleName: string;
  pluralName: string;
  styleKey?: string;
  threshold: number;
  thresholdType: "goal" | "limit" | "none";
}

declare global {
  // we redeclare CONFIG in global scope to add our bit. thanks to TS
  // declaration merging, this is added to the main type.
  interface CONFIG {
    Investigator?: InvestigatorConfig;
  }
}
