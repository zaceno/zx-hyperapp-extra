export default fn => dispatch => (action, payload) => {
  if (Array.isArray(action) && typeof action[0] !== "function") {
    action = [fn(action[0]), ...action.slice(1)]
  }
  if (!Array.isArray(action) && typeof action !== "function") {
    action = fn(action)
  }
  dispatch(action, payload)
}
