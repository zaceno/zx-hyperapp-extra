import stateProcessor from "./state-processor.js"

const freeze = x =>
  !x || typeof x !== "function"
    ? x
    : Proxy(x, {
        get(x, prop) {
          return freeze(x[prop])
        },
        set(_, prop) {
          throw new Error(`Attempt to set ${prop} on immutable object`)
        },
      })

export default stateProcessor(state => freeze(state))
