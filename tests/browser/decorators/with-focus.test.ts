import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import {
  app,
  h,
  text,
  type Dispatch,
  type Action,
  type ElementVNode,
} from "hyperapp"
import withFocus from "../../../src/decorators/with-focus"

type State = { showSpecialInput: boolean; payload: string | null }

const JustAction: Action<State> = state => ({
  ...state,
  showSpecialInput: true,
})
const ActionWithEvent: Action<State, Event> = (state, event) => ({
  ...state,
  showSpecialInput: true,
  payload: (event.target as HTMLButtonElement).getAttribute("id"),
})

const ActionWithPayload: Action<State, string> = (state, payload) => ({
  ...state,
  showSpecialInput: true,
  payload,
})

const view = (state: State): ElementVNode<State> =>
  h("div", {}, [
    h("input", { type: "text" }),
    state.showSpecialInput &&
      h("input", { type: "text", class: "special-input" }),
    h("input", { type: "password" }),
    h(
      "button",
      { id: "just-action", onclick: withFocus(".special-input", JustAction) },
      text("foo"),
    ),
    h(
      "button",
      {
        id: "with-event",
        onclick: withFocus(".special-input", ActionWithEvent),
      },
      text("foo"),
    ),
    h(
      "button",
      {
        id: "with-payload",
        onclick: withFocus(".special-input", [ActionWithPayload, "payload"]),
      },
      text("foo"),
    ),
  ])

const getState = (dispatch: Dispatch<State>): State => {
  let state: State
  dispatch(s => (state = s))
  return state!
}

const init: State = { showSpecialInput: false, payload: null }

const waitAFrame = () => new Promise(res => requestAnimationFrame(res))

describe("withFocus action decorator", () => {
  let dispatch: Dispatch<State>
  let node: HTMLElement

  beforeEach(async () => {
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app({ node, init, view })
    //let app render once
    await waitAFrame()
  })

  afterEach(async () => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    // Hyperapp renders land in a requestAnimationFrame, and a test that ends
    // right after a dispatch (like the synchronous click in the first test)
    // can leave a render still scheduled. Let it land on the still-attached
    // node first: dispatch() with no args is the proper way to stop the app
    // (pending effect dispatches go inert, subscriptions are unsubscribed),
    // but it cannot cancel an already-queued render, which would then call
    // the view with the nulled state and crash.
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    document.body.innerHTML = ""
  })

  it("does nothing in the immediate tick", () => {
    // Use a programmatic click here, not userEvent: it dispatches the event
    // synchronously in the current task, so we can observe the "immediate
    // tick". `await userEvent.click` injects real input events and only
    // resolves after the browser has advanced past the current task and
    // frame — by then the focuser's rAF has already run.
    ;(document.querySelector("#just-action") as HTMLButtonElement).click()
    // a programmatic click doesn't move focus, and activeElement is
    // document.body (never null) when nothing is focused
    expect(document.activeElement).toBe(document.body)
    expect(getState(dispatch).payload).toBeNull()
  })

  it("focuses after a frame render", async () => {
    await userEvent.click(document.querySelector("#just-action")!)
    expect(getState(dispatch).payload).toBeNull()
    await waitAFrame()
    expect(document.activeElement).toBe(
      document.querySelector(".special-input")!,
    )
  })

  it("dispatches the action with the browser event", async () => {
    await userEvent.click(document.querySelector("#with-event")!)
    expect(getState(dispatch).payload).toEqual("with-event")
    await waitAFrame()
    expect(document.activeElement).toBe(
      document.querySelector(".special-input")!,
    )
  })

  it("dispatches the bound action with payload", async () => {
    await userEvent.click(document.querySelector("#with-payload")!)
    expect(getState(dispatch).payload).toEqual("payload")
    await waitAFrame()
    expect(document.activeElement).toBe(
      document.querySelector(".special-input")!,
    )
  })
})
