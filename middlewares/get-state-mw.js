const tapMw = fn => d => (action, payload) => {
  fn(action, payload)
  d(action, payload)
}

export default () => {
  let state
  return {
    state: () => state,
    mw: tapMw((action, payload) => {
      if (typeof action === "function") return
      if (Array.isArray(action) && typeof action[0] !== "function") {
        state = action[0]
      } else {
        state = action
      }
    }),
  }
}
