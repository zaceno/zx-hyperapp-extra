/*
Adds a third argument to all actions dispatched
from a given app
Especially useful in custom elements or other 
multi-app architectures where the same actions
might be shared between multiple apps.
*/

export default d => (action, payload) => {
  let state
  if (typeof action === "function") {
    d(s => (state = s))
    d(action(state, payload, "extra"))
  } else {
    d(action, payload)
  }
}
