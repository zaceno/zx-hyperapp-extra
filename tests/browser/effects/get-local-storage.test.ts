import {
  app,
  h,
  text,
  type Action,
  type Dispatch,
  type Dispatchable,
  type Effecter,
} from "hyperapp"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import getLocalStorage from "../../../src/effects/get-local-storage"

// Browser-mode tests: these run in real Chromium, so `localStorage`, `JSON`
// and the DOM are the real thing. Use this file as a template for other
// effects:
//   1. "direct" tests invoke the effect runner with a recording dispatch and
//      assert on exactly what gets dispatched.
//   2. "app" tests mount a real Hyperapp instance and assert on the rendered
//      DOM, proving the whole effect -> action -> view loop works.

type State = { data: unknown; error: string | null }

type Options = Parameters<typeof getLocalStorage<State>>[0]

const KEY = "hyperapp-extra:test:get-local-storage"

const OnResult: Action<State, unknown> = (state, data) => ({ ...state, data })
const OnError: Action<State, string> = (state, error) => ({ ...state, error })

type DispatchedCall = { action: Dispatchable<State>; data: unknown }

// Runs the effect outside of Hyperapp with a recording dispatch, so we can
// assert on what it dispatches without involving the scheduler.
const runDirectly = (options: Options): DispatchedCall[] => {
  const calls: DispatchedCall[] = []
  const dispatch: Dispatch<State> = (action, data) => {
    calls.push({ action, data: data as unknown })
  }
  const [effecter, payload] = getLocalStorage<State>(options) as readonly [
    Effecter<State, Options>,
    Options,
  ]
  effecter(dispatch, payload)
  return calls
}

describe("getLocalStorage effect, invoked directly", () => {
  beforeEach(() => localStorage.removeItem(KEY))
  afterEach(() => localStorage.removeItem(KEY))

  it("dispatches onResult with the parsed value when the key is set", () => {
    localStorage.setItem(KEY, JSON.stringify({ answer: 42 }))
    const calls = runDirectly({ key: KEY, onResult: OnResult })
    expect(calls).toHaveLength(1)
    expect(calls[0].action).toBe(OnResult)
    expect(calls[0].data).to.deep.equal({ answer: 42 })
  })

  it("dispatches nothing when the key is missing", () => {
    expect(runDirectly({ key: KEY, onResult: OnResult })).toEqual([])
  })

  it("dispatches onError with a message when the stored value is invalid JSON", () => {
    localStorage.setItem(KEY, "{ not json")
    const calls = runDirectly({ key: KEY, onResult: OnResult, onError: OnError })
    expect(calls).toHaveLength(1)
    expect(calls[0].action).toBe(OnError)
    expect(calls[0].data).to.be.a("string")
    expect(calls[0].data as string).not.toBe("")
  })
})

describe("getLocalStorage effect, inside a Hyperapp app", () => {
  let node: HTMLElement

  beforeEach(() => {
    localStorage.removeItem(KEY)
    node = document.createElement("div")
    document.body.appendChild(node)
  })

  afterEach(() => {
    node.remove()
    localStorage.removeItem(KEY)
  })

  // Mounts a minimal app whose init runs the effect. Hyperapp dispatches
  // effects asynchronously, so tests wait for the DOM to settle.
  const mount = () =>
    app<State>({
      init: [
        { data: null, error: null },
        getLocalStorage<State>({
          key: KEY,
          onResult: OnResult,
          onError: OnError,
        }),
      ],
      view: (state) =>
        h("div", {}, [
          h("span", { class: "data" }, text(JSON.stringify(state.data))),
          h("span", { class: "error" }, text(state.error ?? "")),
        ]),
      node,
    })

  const rendered = (selector: string) =>
    node.querySelector(selector)?.textContent ?? null

  it("renders the stored value once the effect dispatches onResult", async () => {
    localStorage.setItem(KEY, JSON.stringify(["a", 1, true]))
    mount()
    await vi.waitFor(() => {
      expect(rendered(".data")).toBe(JSON.stringify(["a", 1, true]))
      expect(rendered(".error")).toBe("")
    })
  })

  it("renders the parse error when the stored value is invalid JSON", async () => {
    localStorage.setItem(KEY, "{ not json")
    mount()
    await vi.waitFor(() => {
      expect(rendered(".error")).to.be.a("string")
      expect(rendered(".error")).not.toBe("")
      expect(rendered(".data")).toBe("null")
    })
  })

  it("renders the initial state when the key is missing", async () => {
    mount()
    await vi.waitFor(() => {
      expect(rendered(".data")).toBe("null")
      expect(rendered(".error")).toBe("")
    })
  })
})
