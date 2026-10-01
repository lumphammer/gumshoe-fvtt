/**
 * Create a function which runs async jobs one at a time per key. Jobs with
 * different keys run independently. A job which throws doesn't stop the ones
 * queued after it.
 */
export function createKeyedQueue() {
  const tails = new Map<string, Promise<unknown>>();

  return function runExclusive<T>(
    key: string,
    job: () => Promise<T>,
  ): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(job);
    tails.set(key, result);
    // tidy up once nothing else is queued behind this job
    void result
      .catch(() => undefined)
      .then(() => {
        if (tails.get(key) === result) tails.delete(key);
      });
    return result;
  };
}
