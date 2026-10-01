const observedLogs = new WeakSet<Element>();

/**
 * Foundry scrolls the chat log to the bottom when a message is posted, but not
 * when an existing message changes height - which our cards do all the time
 * (adding a target, rolling or applying damage, etc.) So the bottom of the card
 * ends up out of view.
 *
 * This watches the log for size changes, and if it was scrolled to the bottom,
 * keeps it there. Content growing doesn't fire a scroll event, so the log's
 * `isAtBottom` still reflects where we were before the change. If the user has
 * scrolled up to read something, we leave them alone.
 */
export function installChatLogScrollKeeper() {
  Hooks.on("renderChatLog", (app, element) => {
    const log = element.querySelector(".chat-scroll > .chat-log");
    if (!log || observedLogs.has(log)) return;
    observedLogs.add(log);
    new ResizeObserver(() => {
      if (app.rendered && app.isAtBottom) {
        void app.scrollBottom();
      }
    }).observe(log);
  });
}
