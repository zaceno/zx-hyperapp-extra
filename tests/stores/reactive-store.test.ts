import { describe, expect, it } from "vitest"
import {
  init,
  set,
  get,
  type ReactiveStoreGetterFunc,
} from "../../src/stores/reactive-store"

describe("Reactive Store", () => {
  it("get unset cell returns undefined", () => {
    let store = init()
    expect(get(store, "foo") === undefined).true
  })

  it("get previously set boolean value works", () => {
    let store = init()
    store = set(store, "foo", false)
    expect(get(store, "foo") === false).true
  })

  it("get previously set numbber value works", () => {
    let store = init()
    store = set(store, "foo", 32)
    expect(get(store, "foo") === 32).true
  })

  it("get previously set string value works", () => {
    let store = init()
    store = set(store, "foo", "stepladder")
    expect(get(store, "foo") === "stepladder").true
  })

  it("get previously set array value works", () => {
    let store = init()
    store = set(store, "foo", ["a", 1, true])
    expect(get(store, "foo")).to.deep.equal(["a", 1, true])
  })

  it("get previously set object value works", () => {
    let store = init()
    store = set(store, "foo", { tip: "a", tap: 1, top: true })
    expect(get(store, "foo")).to.deep.equal({ tip: "a", tap: 1, top: true })
  })

  it("many set values can be retrieved by key", () => {
    const BOOLEAN_TEST = false
    const NUMBER_TEST = 32
    const STRING_TEST = "stepladder"
    const ARRAY_TEST = ["a", 1, true]
    const OBJECT_TEST = { tip: "a", tap: 1, top: true }
    let store = init()
    store = set(store, "boolean", BOOLEAN_TEST)
    store = set(store, "number", NUMBER_TEST)
    store = set(store, "string", STRING_TEST)
    store = set(store, "array", ARRAY_TEST)
    store = set(store, "object", OBJECT_TEST)
    expect(get(store, "boolean")).to.equal(BOOLEAN_TEST)
    expect(get(store, "number")).to.equal(NUMBER_TEST)
    expect(get(store, "string")).to.equal(STRING_TEST)
    expect(get(store, "array")).to.equal(ARRAY_TEST)
    expect(get(store, "object")).to.equal(OBJECT_TEST)
  })

  it("computed with no deps returns value", () => {
    let store = init()
    store = set(store, "foo", () => {
      return 2 + 2
    })
    expect(get(store, "foo")).to.equal(4)
  })

  it("getter for nonexisting deps to return undefined", () => {
    let store = init()
    store = set(store, "foo", (get: ReactiveStoreGetterFunc) => {
      return (get("bar") as number) + 2 //NaN if getter returns undefined
    })
    expect(get(store, "foo")).to.be.NaN
  })

  it("computeds can depend on multiple dependencies", () => {
    let store = init()
    store = set(store, "foo", 5)
    store = set(store, "bar", 3)
    store = set(
      store,
      "baz",
      (g: ReactiveStoreGetterFunc) =>
        (g("foo") as number) * (g("bar") as number) + 2,
    )
    expect(get(store, "baz")).to.equal(17)
    store = set(store, "foo", 3)
    expect(get(store, "baz")).to.equal(11)
    store = set(store, "bar", 2)
    expect(get(store, "baz")).to.equal(8)
  })

  it("a chain of dependencies is recaluclated by one change at the top", () => {
    let store = init()
    store = set(store, "foo", 1)
    store = set(
      store,
      "bar",
      (g: ReactiveStoreGetterFunc) => (g("foo") as number) + 2,
    )
    store = set(
      store,
      "baz",
      (g: ReactiveStoreGetterFunc) => (g("bar") as number) + 12,
    )
    expect(get(store, "foo")).to.equal(1)
    expect(get(store, "bar")).to.equal(3)
    expect(get(store, "baz")).to.equal(15)
    store = set(store, "foo", 101)
    expect(get(store, "foo")).to.equal(101)
    expect(get(store, "bar")).to.equal(103)
    expect(get(store, "baz")).to.equal(115)
  })

  it("circular dependencies don't break", () => {
    let store = init()
    store = set(
      store,
      "foo",
      (g: ReactiveStoreGetterFunc) => (g("bar") as number) + 2,
    )
    store = set(
      store,
      "bar",
      (g: ReactiveStoreGetterFunc) => (g("foo") as number) - 2,
    )
    expect(get(store, "foo")).to.be.NaN
    expect(get(store, "bar")).to.be.NaN
    store = set(store, "baz", 9)
    store = set(
      store,
      "foo",
      (g: ReactiveStoreGetterFunc) => (g("baz") as number) + 2,
    )
    expect(get(store, "bar")).to.equal(9)
  })
})
