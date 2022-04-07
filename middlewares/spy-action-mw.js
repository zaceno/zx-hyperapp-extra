const tapMw = fn => d => (action, payload) => {
  fn(action, payload)
  d(action, payload)
}

export default () => {
  const spyMap = new WeakMap()
  return {
    spy: action => {
      spyMap.set(action, [])
      return () => spyMap.get(action)
    },
    mw: tapMw((action, payload) => {
      if (typeof action === "function" && spyMap.has(action)) {
        spyMap.get(action).push(payload)
      }
    }),
  }
}
