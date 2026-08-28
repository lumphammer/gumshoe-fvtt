export function createSerializedUpdateQueue<Key>() {
  const pendingUpdates = new Map<Key, Promise<void>>();

  return <Result>(key: Key, update: () => Promise<Result>): Promise<Result> => {
    const previousUpdate = pendingUpdates.get(key) ?? Promise.resolve();
    const currentUpdate = previousUpdate.then(update);
    const settledUpdate = currentUpdate.then(
      () => undefined,
      () => undefined,
    );
    pendingUpdates.set(key, settledUpdate);
    void settledUpdate.then(() => {
      if (pendingUpdates.get(key) === settledUpdate) {
        pendingUpdates.delete(key);
      }
    });
    return currentUpdate;
  };
}
