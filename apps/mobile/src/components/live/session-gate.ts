/** Invalidates in-flight permission/storage work when its screen is no longer active. */
export function createSessionGate() {
  let generation = 0;
  return {
    cancel() {
      generation++;
    },
    async run<T>(
      prepare: (isCurrent: () => boolean) => Promise<T>,
      commit: (value: T) => void,
    ) {
      const ticket = ++generation;
      const isCurrent = () => ticket === generation;
      try {
        const value = await prepare(isCurrent);
        if (!isCurrent()) return false;
        commit(value);
        return true;
      } catch (error) {
        if (!isCurrent()) return false;
        throw error;
      }
    },
  };
}
