import { DeepPartial } from "fvtt-types/utils";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import { GamePauseBanner } from "../components/GamePauseBanner";
import { assertGame } from "../functions/isGame";
import { GamePause } from "../fvtt-exports";

/**
 * Replacement for Foundry's "game paused" banner. Foundry's version is a
 * rotating clock, which - because it's taller on the diagonal than it is
 * square-on - makes the banner it sits in jiggle as it turns.
 *
 * We can't use `ReactApplicationV2Mixin` here because `GamePause`'s render
 * context doesn't extend `ApplicationV2.RenderContext` (Foundry's
 * `_prepareContext` doesn't call `super`), so it doesn't satisfy the mixin's
 * constraint. It's a small enough app to mount React by hand.
 */
export class InvestigatorGamePause<
  RenderContext extends GamePause.RenderContext = GamePause.RenderContext,
  Configuration extends GamePause.Configuration = GamePause.Configuration,
  RenderOptions extends GamePause.RenderOptions = GamePause.RenderOptions,
> extends GamePause<RenderContext, Configuration, RenderOptions> {
  #root: Root | undefined;
  #rootElement: HTMLElement | undefined;

  /**
   * `GamePause` is frameless, so `content` here is the `<figure id="pause">`
   * itself and we can hand the whole thing over to React. We ignore the img and
   * caption from `_renderHTML` - all we need from Foundry is the `paused`
   * class, which is what actually shows and hides the banner.
   */
  protected override _replaceHTML(
    result: GamePause.RenderHTMLReturn,
    content: HTMLElement,
    options: DeepPartial<RenderOptions>,
  ) {
    assertGame(game);
    content.classList.toggle("paused", game.paused);
    let root = this.#root;
    if (root === undefined || this.#rootElement !== content) {
      root?.unmount();
      root = this.#root = createRoot(content);
      this.#rootElement = content;
    }
    root.render(
      <StrictMode>
        <GamePauseBanner />
      </StrictMode>,
    );
  }
}
