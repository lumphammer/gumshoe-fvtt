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
 */
export function installCommitRecorder() {
  type Fiber = {
    tag: number;
    flags: number;
    child: Fiber | null;
    sibling: Fiber | null;
    alternate: Fiber | null;
    actualDuration?: number;
  };
  type FiberRoot = { current: Fiber; containerInfo: Element };

  // React's `PerformedWork` flag, and the tags of fibers that are components
  // (function, class, forwardRef, simple memo), as React DevTools counts them
  const performedWork = 1;
  const componentTags = new Set([0, 1, 11, 15]);

  /** Components that rendered in the commit `fiber` is part of. */
  const countRendered = (fiber: Fiber): number => {
    const previous = fiber.alternate;
    let count =
      componentTags.has(fiber.tag) &&
      (previous === null || (fiber.flags & performedWork) !== 0)
        ? 1
        : 0;
    // a subtree React bailed out of keeps its old children
    if (previous !== null && previous.child === fiber.child) return count;
    for (let child = fiber.child; child !== null; child = child.sibling) {
      count += countRendered(child);
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
      bench.commits.push({
        time: performance.now(),
        renderMs: root.current.actualDuration,
        rendered: countRendered(root.current),
        container: root.containerInfo,
      });
    },
  };
}
