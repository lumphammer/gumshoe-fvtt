const observedLogs = new WeakSet<Element>();

// allows for fractional scroll positions when the page is zoomed
const bottomTolerancePx = 2;

/**
 * Foundry scrolls the chat log to the bottom when a message is posted, but not
 * when an existing message changes height - which our cards do all the time
 * (adding a target, rolling or applying damage, etc.) So the bottom of the card
 * ends up out of view.
 *
 * This watches the log for size changes, and if it was scrolled to the bottom,
 * keeps it there. If the user has scrolled up to read something, we leave them
 * alone.
 *
 * We track "at the bottom" ourselves rather than using the log's `isAtBottom`,
 * which is true anywhere within the last 1% of the scroll range - hundreds of
 * pixels in a long log, so clicking a button on a card near the end would
 * yank the log down. Content growing doesn't fire a scroll event, so the value
 * from the last scroll event still reflects where we were before the change.
 */
export function installChatLogScrollKeeper() {
  Hooks.on("renderChatLog", (app, element) => {
    const scroll = element.querySelector(".chat-scroll");
    const log = scroll?.querySelector(":scope > .chat-log");
    if (!scroll || !log || observedLogs.has(log)) return;
    observedLogs.add(log);

    let atBottom = true;
    scroll.addEventListener(
      "scroll",
      () => {
        atBottom =
          scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop <=
          bottomTolerancePx;
      },
      { passive: true },
    );
    new ResizeObserver(() => {
      if (app.rendered && atBottom) {
        void app.scrollBottom();
      }
    }).observe(log);
  });
}
