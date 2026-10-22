import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  app,
  h,
  text,
  type Action,
  type Dispatch,
  type Dispatchable,
  type ElementVNode,
} from "hyperapp"
import { withPreventDefault } from "../../../src/decorators/with-prevent-default"

// Tests for the withPreventDefault action decorator. Its contract:
//   1. calling the wrapped action calls event.preventDefault() synchronously
//   2. the state is passed through untouched, and an effect dispatches the
//      wrapped action to hyperapp
//   3. for a plain action, hyperapp dispatches it with the event as payload
//   4. for an [action, payload] tuple, hyperapp unpacks it and dispatches
//      action with payload — the event is dropped, but it was still
//      preventDefaulted
// The "direct" tests assert 1-4 precisely via a recording dispatch; the "link"
// tests prove it end-to-end with a real <a href> click, where a prevented
// default means no navigation.

type State = { payload: string | null; eventDefaultPrevented: boolean | null }

const init: State = { payload: null, eventDefaultPrevented: null }

const RecordEvent: Action<State, Event> = (state, event) => ({
  ...state,
  payload: "event",
  // true iff preventDefault() ran before the action was dispatched
  eventDefaultPrevented: event.defaultPrevented,
})

const RecordPayload: Action<State, string> = (state, payload) => ({
  ...state,
  payload,
})

// explicit tuple: hyperapp sees [action, payload] and dispatches action
// with payload, ignoring anything else (i.e. the event)
const boundAction: [Action<State, string>, string] = [
  RecordPayload,
  "bound-payload",
]

// The wrapped action returns [state, effect]; unpack it to observe what
// would reach hyperapp.
type EffectTuple = readonly [State, (dispatch: Dispatch<State>) => void]

const unpack = (dispatchable: Dispatchable<State>) =>
  dispatchable as unknown as EffectTuple

const runWrappedEffect = (
  dispatchable: Dispatchable<State>,
  dispatch: Dispatch<State>,
) => unpack(dispatchable)[1](dispatch)

const recordingDispatch = () => {
  const calls: { action: Dispatchable<State>; payload: unknown }[] = []
  const dispatch: Dispatch<State> = (action, payload) => {
    calls.push({ action, payload })
  }
  return { calls, dispatch }
}

const getState = (dispatch: Dispatch<State>): State => {
  let state: State
  dispatch(s => (state = s))
  return state!
}

const waitAFrame = () => new Promise(res => requestAnimationFrame(res))

describe("withPreventDefault decorator, invoked directly", () => {
  it("prevents default synchronously and passes the state through", () => {
    const event = new MouseEvent("click", { cancelable: true })
    const dispatchable = withPreventDefault(RecordEvent)(init, event)
    expect(event.defaultPrevented).toBe(true)
    expect(unpack(dispatchable)[0]).toBe(init)
  })

  it("dispatches the wrapped action with the same event", () => {
    const event = new MouseEvent("click", { cancelable: true })
    const dispatchable = withPreventDefault(RecordEvent)(init, event)
    const { calls, dispatch } = recordingDispatch()
    runWrappedEffect(dispatchable, dispatch)
    expect(calls).toHaveLength(1)
    expect(calls[0].action).toBe(RecordEvent)
    expect(calls[0].payload).toBe(event)
  })

  it("dispatches a bound [action, payload] tuple — payload wins, event dropped", () => {
    const event = new MouseEvent("click", { cancelable: true })
    const dispatchable = withPreventDefault(boundAction)(init, event)
    // default is prevented even though the action never sees the event
    expect(event.defaultPrevented).toBe(true)
    const { calls, dispatch } = recordingDispatch()
    runWrappedEffect(dispatchable, dispatch)
    expect(calls).toHaveLength(1)
    // hyperapp will unpack this tuple as dispatch(action[0], action[1])
    expect(calls[0].action).toBe(boundAction)
    expect(calls[0].payload).toBe(event)
  })

  it("is a harmless no-op on non-cancelable events", () => {
    // MouseEvent defaults to cancelable: false
    const event = new MouseEvent("click")
    const dispatchable = withPreventDefault(RecordEvent)(init, event)
    expect(event.defaultPrevented).toBe(false)
    // the action is dispatched regardless
    const { calls, dispatch } = recordingDispatch()
    runWrappedEffect(dispatchable, dispatch)
    expect(calls).toHaveLength(1)
  })
})

const view = (state: State): ElementVNode<State> =>
  h("div", {}, [
    // control: without the decorator the click really navigates, which is
    // what makes the "no navigation" assertions below meaningful
    h("a", { id: "link-control", href: "#control" }, text("go")),
    h(
      "a",
      {
        id: "link-event",
        href: "#prevented-event",
        onclick: withPreventDefault(RecordEvent),
      },
      text("go"),
    ),
    h(
      "a",
      {
        id: "link-payload",
        href: "#prevented-payload",
        onclick: withPreventDefault(boundAction),
      },
      text("go"),
    ),
  ])

describe("withPreventDefault decorator, on a real link click", () => {
  let dispatch: Dispatch<State>
  let node: HTMLElement

  const resetLocation = () =>
    history.replaceState(null, "", location.pathname + location.search)

  beforeEach(async () => {
    resetLocation()
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app({ node, init, view })
    //let app render once
    await waitAFrame()
  })

  afterEach(async () => {
    // drain a frame so any scheduled render lands, then stop the app with
    // dispatch() (no args) — pending effect dispatches go inert and
    // subscriptions stop — and finally clean up the DOM and location it
    // leaves behind
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    resetLocation()
    document.body.innerHTML = ""
  })

  const click = (id: string) =>
    (node.querySelector(id) as HTMLAnchorElement).click()

  it("control: an unwrapped link click navigates", () => {
    click("#link-control")
    expect(location.hash).toBe("#control")
    expect(getState(dispatch).payload).toBeNull()
  })

  it("prevents navigation and dispatches the action with the click event", () => {
    click("#link-event")
    expect(location.hash).toBe("")
    const state = getState(dispatch)
    expect(state.payload).toBe("event")
    // the wrapped action observed the event as already prevented
    expect(state.eventDefaultPrevented).toBe(true)
  })

  it("prevents navigation and dispatches the bound action with its payload", () => {
    click("#link-payload")
    expect(location.hash).toBe("")
    expect(getState(dispatch).payload).toBe("bound-payload")
  })
})
