const noop = () => {}
export default () => {
  const mocks = new WeakMap()
  return {
    wrap: original => state => {
      if (!original) return []
      return original(state)
        .filter(x => Array.isArray(x))
        .map(([sub, opts]) => [mocks.has(sub) ? mocks.get(sub) : sub, opts])
    },
    mock: (original, fn) => {
      let _trigger = noop
      mocks.set(original, (dispatch, props) => {
        _trigger = (...args) => fn(dispatch, props, ...args)
        return () => {
          _trigger = noop
        }
      })
      return (...args) => _trigger(...args)
    },
  }
}
