import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app, h, type Dispatch, type Action } from "hyperapp"
import focuser from "../../../src/effects/focuser"

const waitAFrame = async () => {
  await new Promise(res => requestAnimationFrame(res))
}

describe("focuser effect", () => {
  type State = { showSpecialInput: boolean }

  const ShowAndFocus: Action<State> = () => [
    { showSpecialInput: true },
    focuser(".special-input"),
  ]

  let dispatch: Dispatch<State>
  let node: HTMLElement

  beforeEach(async () => {
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app<State>({
      node,
      init: { showSpecialInput: false },
      view: state =>
        h("div", {}, [
          h("input", { type: "text" }),
          state.showSpecialInput &&
            h("input", { type: "text", class: "special-input" }),
          h("input", { type: "password" }),
        ]),
    })
    //let app render once
    await new Promise(res => requestAnimationFrame(res))
  })

  afterEach(async () => {
    // Drain a frame first: "does nothing in the immediate tick" ends with a
    // render still scheduled, and the kill switch below can't cancel it.
    // Then stop the app properly with dispatch() (no args: pending effect
    // dispatches go inert, subscriptions stop), then clear the DOM it leaves
    // behind.
    await new Promise(res => requestAnimationFrame(res))
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    // Don't leak DOM or focus state into the next test.
    ;(document.activeElement as HTMLElement | null)?.blur()
    node.remove()
  })

  it("does nothing in the immediate tick", () => {
    dispatch(ShowAndFocus)
    // programmatic dispatch doesn't move focus in Chromium
    expect(document.activeElement).toBe(document.body)
  })

  it("sets the focus afer ensuring the element rendered", async () => {
    dispatch(ShowAndFocus)
    await waitAFrame()
    // compare against this app's own element: document-wide queries could
    // match a leftover element from a previous test
    expect(document.activeElement).toBe(node.querySelector(".special-input"))
  })
})
