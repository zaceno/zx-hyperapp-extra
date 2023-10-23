/**
 * Utility for testing hyperapp app/state logic. Pass it an init parameter
 * and an effectHandler - a function that will replace every effecter used
 * it will be called with (originalEffecter, payload) every time an effect
 * is used allowing you to ovverride it and test that the right effecter
 * was called, et c.
 *
 * Returns an object with some useful functions: getState allows you to
 * inspect the state at any time, stop stops the app. dispatch dispatches
 * actions.
 *
 * Subscriptions not supported yet. Nor views - but views are beyond
 * the scope/purpose of this. This is just for state-logic.
 */
export default (init, effectHandler = () => {}) => {
  const getMockEffect = effecter => (dispatch, payload) => {
    effectHandler(effecter, payload)
  }
  let state
  const dispatch = app({
    init: init,
    dispatch: dispatch => (action, payload) => {
      if (Array.isArray(action)) {
        if (typeof action[0] !== "function") {
          state = action[0]
          action = [
            action[0],
            ...action
              .slice(1)
              .map(f =>
                typeof f === "function"
                  ? getMockEffect(f)
                  : [getMockEffect(f[0]), f[1]]
              ),
          ]
        }
      } else if (typeof action !== "function") {
        state = action
      }
      dispatch(action, payload)
    },
  })
  const getState = () => state
  const stop = () => dispatch()
  return { getState, dispatch, stop }
}
