/*

Attach a handler to do stuff with the element of a vnode when it is first created.
withElement(vnode, (elem) => { ...do stuff with the elem ...})

To trigger actions from the element callback, dispatch an event on 
the element and have a handler in the vnode to dispatch an action.

*/

export default (vnode, fn) => {
  let elem
  return Object.defineProperty(vnode, "node", {
    get() {
      return elem
    },
    set(e) {
      if (elem === e) return
      elem = e
      window.queueMicrotask(() => fn(elem))
    },
  })
}
