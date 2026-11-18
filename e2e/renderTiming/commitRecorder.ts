/**
 * What the page records about each React commit (see
 * `installCommitRecorder`).
 */
export interface Commit {
  /** `performance.now()` when React committed. */
  time: number;
  /**
   * How long React spent rendering for this commit, in ms (only with React's
   * profiling build: `pnpm build:profiling`).
   */
  renderMs: number | undefined;
  /** How many components rendered (rather than bailing out). */
  rendered: number;
  /** The DOM element the React root renders into. */
  container: Element;
  /** How many of each component rendered, by name. */
  byComponent: Record<string, number>;
  /**
   * Time each component spent rendering itself (not its children), by name,
   * in ms (profiling build only).
   */
  selfMsByComponent: Record<string, number>;
}

export interface RenderBench {
  commits: Commit[];
  /** When the first document hook fired since this was last reset. */
  hookTime: number | null;
  /** Operations to time, by name (set up by each scenario). */
  ops: Record<string, (i: number) => Promise<unknown>>;
}

declare global {
  var renderBench: RenderBench;
}

/**
 * Install a stand-in for React DevTools' global hook, which React calls on
 * every commit. Run with `page.addInitScript`, before React loads: so it must
 * be self-contained.
 *
 * `walk`: when to walk each commit's fibers, to count and time the components
 * that rendered. "always" (the default), or "profiling" for only in React's
 * profiling build, so that a production build's main-thread time doesn't
 * include the walk (its commits then have `rendered: 0` and no names).
 */
export function installCommitRecorder(
  { walk }: { walk: "always" | "profiling" } = { walk: "always" },
) {
  type Fiber = {
    tag: number;
    flags: number;
    child: Fiber | null;
    sibling: Fiber | null;
    alternate: Fiber | null;
    actualDuration?: number;
    type: unknown;
  };
  type FiberRoot = { current: Fiber; containerInfo: Element };

  // React's `PerformedWork` flag, and the tags of fibers that are components
  // (function, class, forwardRef, simple memo), as React DevTools counts them
  const performedWork = 1;
  const componentTags = new Set([0, 1, 11, 15]);

  /** A component's name, from its type. */
  const nameOf = (type: unknown): string => {
    if (typeof type === "function") {
      const fn = type as { displayName?: string; name?: string };
      return fn.displayName || fn.name || "Anonymous";
    }
    if (typeof type === "object" && type !== null) {
      const t = type as {
        displayName?: string;
        render?: unknown;
        type?: unknown;
      };
      return t.displayName ?? nameOf(t.render ?? t.type);
    }
    return "Anonymous";
  };

  /** Count (and time) the components that rendered in `fiber`'s subtree. */
  const countRendered = (
    fiber: Fiber,
    byComponent: Record<string, number>,
    selfMsByComponent: Record<string, number>,
    /** The nearest named component above, to place anonymous ones. */
    parentName = "root",
  ): number => {
    const previous = fiber.alternate;
    // a subtree React bailed out of keeps its old children
    const reusedChildren = previous !== null && previous.child === fiber.child;
    let count = 0;
    let nextParentName = parentName;
    if (componentTags.has(fiber.tag)) {
      const ownName = nameOf(fiber.type);
      const name =
        ownName === "Anonymous" ? `Anonymous in ${parentName}` : ownName;
      // named ancestors place anonymous components whether they rendered or not
      if (ownName !== "Anonymous") nextParentName = ownName;
      if (previous === null || (fiber.flags & performedWork) !== 0) {
        count = 1;
        byComponent[name] = (byComponent[name] ?? 0) + 1;
        if (fiber.actualDuration !== undefined) {
          // React adds its children's time only when they rendered again
          let self = fiber.actualDuration;
          if (!reusedChildren) {
            for (let c = fiber.child; c !== null; c = c.sibling) {
              self -= c.actualDuration ?? 0;
            }
          }
          selfMsByComponent[name] = (selfMsByComponent[name] ?? 0) + self;
        }
      }
    }
    if (reusedChildren) return count;
    for (let child = fiber.child; child !== null; child = child.sibling) {
      count += countRendered(
        child,
        byComponent,
        selfMsByComponent,
        nextParentName,
      );
    }
    return count;
  };

  const bench: RenderBench = { commits: [], hookTime: null, ops: {} };
  globalThis.renderBench = bench;

  let nextRendererId = 1;
  (globalThis as Record<string, unknown>)["__REACT_DEVTOOLS_GLOBAL_HOOK__"] = {
    isDisabled: false,
    supportsFiber: true,
    renderers: new Map(),
    inject: () => nextRendererId++,
    checkDCE: () => undefined,
    onScheduleFiberRoot: () => undefined,
    onCommitFiberUnmount: () => undefined,
    onPostCommitFiberRoot: () => undefined,
    onCommitFiberRoot: (_rendererId: number, root: FiberRoot) => {
      const time = performance.now();
      const renderMs = root.current.actualDuration;
      const byComponent: Record<string, number> = {};
      const selfMsByComponent: Record<string, number> = {};
      const walkThis = walk === "always" || renderMs !== undefined;
      bench.commits.push({
        time,
        renderMs,
        rendered: walkThis
          ? countRendered(root.current, byComponent, selfMsByComponent)
          : 0,
        container: root.containerInfo,
        byComponent,
        selfMsByComponent,
      });
    },
  };
}
