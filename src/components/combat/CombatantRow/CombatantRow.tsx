import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { createContext, memo, useContext } from "react";

import { css, cx } from "../../../styled-system/css";
import { assertGame } from "../../../functions/isGame";
import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import {
  NativeContextMenuTrigger,
  NativeContextMenuWrapper,
} from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import {
  CombatantContextProvider,
  useCombatantContextValue,
} from "./CombatantContext";
import {
  CombatantActiveContext,
  usePassingTurns,
} from "./CombatantTurnContext";
import { Content } from "./Content";

interface CombatantRowProps {
  combatant: InvestigatorCombatant;
  /** Whether it's this combatant's turn. */
  active: boolean;
}

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const customAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const customTransition = {
  duration: 400,
  easing: "linear",
};

/** What the row's `<li>` shows, which changes as the row does */
type RowShell = {
  id: string;
  active: boolean;
  hidden: boolean;
  defeated: boolean;
  depleted: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: SyntheticListenerMap | undefined;
  transform: string | undefined;
  transition: string | undefined;
};

const RowShellContext = createContext<RowShell | null>(null);

/**
 * The row's `<li>`, which is also its context menu's trigger. It reads the
 * row from `RowShellContext`, so the menu's root above it (given this as a
 * constant element) doesn't re-render when the row does.
 */
const RowListItem = () => {
  const shell = useContext(RowShellContext);
  if (shell === null) {
    throw new Error("RowListItem must be rendered inside a CombatantRow");
  }
  const { setNodeRef, setActivatorNodeRef, attributes, listeners } = shell;
  return (
    <NativeContextMenuTrigger asChild>
      <li
        ref={setNodeRef}
        className={cx(
          "combatant",
          shell.active && "active",
          shell.hidden && "hide",
          shell.defeated && "defeated",
          css({ alignItems: "start" }),
        )}
        {...attributes}
        data-combatant-id={shell.id}
        style={{
          transform: shell.transform,
          transition: shell.transition,
          opacity: shell.depleted && !shell.active ? 0.7 : 1,
        }}
      >
        {/* the row content is pushed down so it can memoise even if the
        draggable hook is updating very frequently */}
        <Content
          setActivatorNodeRef={setActivatorNodeRef}
          listeners={listeners}
        />
      </li>
    </NativeContextMenuTrigger>
  );
};

const rowListItem = <RowListItem />;

export const CombatantRow = memo(({ combatant, active }: CombatantRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({
    id: combatant.id ?? "",
    transition: customTransition,
    animateLayoutChanges: customAnimateLayoutChanges,
  });

  assertGame(game);
  const combat = combatant.combat;
  if (combat === null) {
    throw new Error(
      "CombatantRow must be rendered with a combatant that is in combat.",
    );
  }

  const id = combatant.id;
  if (id === null) {
    throw new Error(
      "CombatantRow must be rendered with a combatant that has an id.",
    );
  }

  const combatantContextValue = useCombatantContextValue(combatant);

  // turns remaining depend on the round, which a memoised row would
  // otherwise miss (going back to a round already played updates no
  // combatants)
  const passingTurns = usePassingTurns(combatant);
  const depleted = passingTurns !== null && passingTurns.remaining <= 0;

  const shell: RowShell = {
    id,
    active,
    hidden: combatantContextValue.combatantState.hidden ?? false,
    defeated: combatantContextValue.combatantState.defeated ?? false,
    depleted,
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <CombatantContextProvider value={combatantContextValue}>
      <CombatantActiveContext.Provider value={active}>
        <RowShellContext.Provider value={shell}>
          <NativeContextMenuWrapper>{rowListItem}</NativeContextMenuWrapper>
        </RowShellContext.Provider>
      </CombatantActiveContext.Provider>
    </CombatantContextProvider>
  );
});

CombatantRow.displayName = "CombatantRow";
