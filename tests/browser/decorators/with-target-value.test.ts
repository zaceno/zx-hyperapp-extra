import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import {
  app,
  h,
  text,
  type Action,
  type Dispatch,
  type Dispatchable,
  type ElementVNode,
} from "hyperapp"
import { withTargetValue } from "../../../src/decorators/with-target-value"

// Tests for the withTargetValue action decorator: it adapts an action that
// wants the input's current value as a string into an event action for input
// elements. It returns [action, event.target.value], which hyperapp unpacks
// as dispatch(action, value); the incoming state is ignored on purpose.
// Bound [action, payload] tuples are deliberately NOT supported — the
// decorator's whole purpose is to supply the payload itself (checked at
// compile time below).

type State = { value: string; edits: number }

const init: State = { value: "", edits: 0 }

const SetValue: Action<State, string> = (state, value) => ({
  value,
  edits: state.edits + 1,
})

// The decorator's return value as hyperapp sees it: [action, payload].
type DispatchTuple = readonly [Action<State, string>, string]

const asTuple = (dispatchable: Dispatchable<State>) =>
  dispatchable as unknown as DispatchTuple

const getState = (dispatch: Dispatch<State>): State => {
  let state: State
  dispatch(s => (state = s))
  return state!
}

const waitAFrame = () => new Promise(res => requestAnimationFrame(res))

// Compile-time guards — never invoked, checked by tsc:
const _typeChecks = () => {
  // @ts-expect-error - accepts a plain Action<S, string>, not a tuple;
  // the decorator supplies the payload itself
  withTargetValue<State>([SetValue, "payload"])
  // @ts-expect-error - the wrapped action receives the value as a string,
  // not the raw event
  withTargetValue<State>((_state: State, _event: Event) => _state)
}
void _typeChecks

describe("withTargetValue decorator, invoked directly", () => {
  // Build an event the way the browser does: dispatch it on a real input so
  // event.target is set for us.
  const inputEventOn = (input: HTMLInputElement): Event => {
    let captured: Event | undefined
    input.addEventListener("input", e => (captured = e))
    input.dispatchEvent(new Event("input"))
    return captured!
  }

  it("returns [action, input.value] for an input event", () => {
    const input = document.createElement("input")
    input.value = "direct"
    const dispatchable = withTargetValue<State>(SetValue)(
      init,
      inputEventOn(input),
    )
    // hyperapp will unpack this as dispatch(SetValue, "direct")
    expect(asTuple(dispatchable)[0]).toBe(SetValue)
    expect(asTuple(dispatchable)[1]).toBe("direct")
  })

  it("captures the value at dispatch time, not when the input later changes", () => {
    const input = document.createElement("input")
    input.value = "first"
    const dispatchable = withTargetValue<State>(SetValue)(
      init,
      inputEventOn(input),
    )
    input.value = "changed after"
    expect(asTuple(dispatchable)[1]).toBe("first")
  })

  it("holds the action in the state slot, so hyperapp dispatches instead of assigning", () => {
    const input = document.createElement("input")
    input.value = "x"
    const dispatchable = withTargetValue<State>(SetValue)(
      init,
      inputEventOn(input),
    )
    // first tuple element is a function → hyperapp dispatches it with the
    // payload; had it returned state, hyperapp would assign it directly
    expect(asTuple(dispatchable)[0]).toBe(SetValue)
    expect(typeof asTuple(dispatchable)[0]).toBe("function")
  })
})

const view = (state: State): ElementVNode<State> =>
  h("div", {}, [
    h("input", {
      id: "field",
      type: "text",
      value: state.value,
      oninput: withTargetValue(SetValue),
    }),
    h("span", { class: "echo" }, text(state.value)),
  ])

describe("withTargetValue decorator, on a real input in an app", () => {
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
    // drain a frame so scheduled renders land, stop the app properly with
    // dispatch() (no args), then clear the DOM it leaves behind
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    document.body.innerHTML = ""
  })

  const field = () => node.querySelector("#field") as HTMLInputElement

  it("delivers the input's current value to the action with every keystroke", async () => {
    await userEvent.click(field())
    await userEvent.type(field(), "hello")
    const state = getState(dispatch)
    expect(state.value).toBe("hello")
    // one input event per typed character, each carrying the full current
    // value ("h", "he", "hel", ...)
    expect(state.edits).toBe("hello".length)
  })

  it("renders the typed value into the view", async () => {
    await userEvent.click(field())
    await userEvent.type(field(), "hi")
    await waitAFrame()
    expect(node.querySelector(".echo")?.textContent).toBe("hi")
    expect(field().value).toBe("hi")
  })

  it("keeps the input element and state in sync for subsequent edits", async () => {
    await userEvent.click(field())
    await userEvent.type(field(), "ab")
    await waitAFrame()
    await userEvent.type(field(), "c")
    await waitAFrame()
    expect(getState(dispatch).value).toBe("abc")
    expect(field().value).toBe("abc")
  })
})
