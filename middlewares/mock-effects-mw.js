const tapMw = fn => d => (action, payload) => {
  fn(action, payload)
  d(action, payload)
}

export default () => {
  const mockMap = new WeakMap()
  const getMocked = fn => (mockMap.has(fn) ? mockMap.get(fn) : fn)
  return {
    mock: (effectFunction, callback) => {
      mockMap.set(effectFunction, callback)
    },
    mw: d => (action, payload) =>
      d(
        Array.isArray(action) && typeof action[0] !== "function"
          ? [
              action[0],
              ...action
                .slice(1)
                .map(effect =>
                  typeof effect === "function"
                    ? getMocked(effect)
                    : Array.isArray(effect)
                    ? [getMocked(effect[0]), effect[1]]
                    : effect
                ),
            ]
          : action,
        payload
      ),
  }
}
