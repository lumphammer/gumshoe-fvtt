interface BabeleFacade {
  setSystemTranslationsDir: (dir: string) => void;
}

/**
 * Point Babele at our pack translations. It has to happen in Babele's own
 * `babele.init` hook: Babele makes a fresh instance in its `init` hook, which
 * runs after ours, so anything we set up on `Babele.get()` before then is
 * lost.
 */
export const registerBabele = () => {
  Hooks.once(
    "babele.init" as Hooks.HookName,
    ((babele: BabeleFacade) => {
      babele.setSystemTranslationsDir("lang/babele");
    }) as any,
  );
};
