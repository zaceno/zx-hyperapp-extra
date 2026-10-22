import { type Dispatch, Effect } from "hyperapp"

const _focuser = (_: Dispatch<unknown>, selector: string) => {
  requestAnimationFrame(() => {
    const elem = document.querySelector(selector)
    if (!elem) return
    if (!(elem instanceof HTMLInputElement)) return
    elem.focus()
  })
}

export default (selector: string) => [_focuser, selector] as Effect<any, string>
