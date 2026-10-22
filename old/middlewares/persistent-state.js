/*

When you are developing using a live-reloading server, it can be 
annoying when the state keeps resetting. This middleware (just
meant for debugging) persists state across reloads so you see
immediate changes on what you were workig on, without extra steps
over and over to get back to where you were.

Usage:

```js
import {app} from 'hyperapp'
import persistence from './persistence.js'

app({
  ...
  dispatch: persistence
})
```
*/

const getSaved = () => {
  let json = localStorage.getItem("persistent-state")
  return json ? JSON.parse(json) : null
}

/** @param {any} state */
const setSaved = state => {
  localStorage.setItem("persistent-state", JSON.stringify(state))
}

/** @template S @typedef {import('hyperapp').Dispatch<S> } Dispatch*/
/** @type {<S>(d:Dispatch<S>)=>Dispatch<S>}*/
export default d => {
  let started = false
  return (action, payload) => {
    if (typeof action !== "function" && !Array.isArray(action)) {
      if (started) {
        setSaved(action)
      } else {
        started = true
        let prev = getSaved()
        if (!prev) {
          setSaved(action)
        } else {
          action = prev
        }
      }
    }
    return d(action, payload)
  }
}
