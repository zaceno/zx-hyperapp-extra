/*

Simple helper to let you start multiple apps on a page
with synchronized state. Useful in mostly statically/server-side
rendered pages with small islands of interactivity.

exports a function which will instantiate and return
an app-prop-decorator. If you use the same app-prop-decorator
to "wrap" the props passed to a number of apps, the state of
all those apps will be synchronized. 

For initial state needed by individual synced apps, always
use actions that merge existing state with what the app 
needs. If it sets the state directly/explicitly it will
undo any initial state set by other apps.

Usage:

import makeSynchromizer from './lib/synced-islands.js'
const synced = makeSynchronizer({initialProp: 'foo'})
...
//app A
app(synced({
  node: elementA
  init: state => ({...state, propA: 'bar'}),
  view: ... // can make use of initialProp, propA, or propB
  // could also specify subscriptions & dispatch
}))
// the shared state is now {initialProp: 'foo', propA: 'bar'}

...

//app B 
app(synced({
  init: state => ({...state, propB: 'baz'})
  ...
}))
// the shared state is now {initialProp: 'foo', propA: 'bar', propB: 'baz'}


*/

export default (state = {}) => {
  const stateRef = { state }
  const synced = []
  const syncmw = dispatch => {
    synced.push(dispatch)
    return (action, payload) => {
      const news = Array.isArray(action) ? action[0] : action
      if (
        typeof news !== "function" &&
        stateRef.state !== news &&
        news != null
      ) {
        stateRef.state = news
        synced.forEach(d => d(news))
      }
      dispatch(action, payload)
    }
  }
  return props => ({
    ...props,
    dispatch: d => syncmw(props.dispatch ? props.dispatch(d) : d),
    init: [stateRef.state, !!props.init && (d => d(props.init))],
  })
}
