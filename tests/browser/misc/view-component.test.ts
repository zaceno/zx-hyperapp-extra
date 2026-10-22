import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  app,
  h,
  text,
  type Action,
  type ClassProp,
  type Dispatch,
  type ElementVNode,
  type VNode,
} from "hyperapp"
import viewComponent from "../../../src/misc/view-component"

const waitAFrame = () => new Promise(res => requestAnimationFrame(res))

const getState = <S>(dispatch: Dispatch<S>): S => {
  let state: S
  dispatch(s => (state = s))
  return state!
}

const classOf = (vnode: VNode<any>): string | undefined =>
  (vnode as ElementVNode<any>).props.class as string | undefined

const classesOf = (element: Element) => Array.from(element.classList).sort()

// Build a component whose inner element has the given class, then wrap it
// with the given class prop. Reading props.class shows what hyperapp would
// eventually write to the DOM (h() already normalizes ClassProp values).
const renderedClass = (
  innerClass: ClassProp | undefined,
  wrapperClass: ClassProp,
) => {
  const Inner = viewComponent<{}>(() =>
    h("div", { class: innerClass }, text("content")),
  )
  return classOf(Inner({ class: wrapperClass }))
}

describe("viewComponent, invoked directly", () => {
  it("returns the inner element vnode untouched when neither key nor class is supplied", () => {
    const inner = h("div", { id: "inner" }, text("content"))
    const Wrapped = viewComponent<{}>(() => inner)

    expect(Wrapped({})).toBe(inner)
  })

  it("adds the key to the top-level element vnode", () => {
    const inner = h("section", {}, [h("div", {}, text("nested"))])
    const Wrapped = viewComponent<{}>(() => inner)

    const vnode = Wrapped({ key: "row-1" })

    expect(vnode.tag).toBe("section")
    expect(vnode.key).toBe("row-1")
    // The key belongs on the vnode returned by viewComponent, not on a child.
    const child = (vnode as ElementVNode<any>).children[0] as VNode<any>
    expect(child.key).toBeUndefined()
  })

  it("keeps an inner vnode's own key when no key is supplied", () => {
    const inner = h("div", { key: "inner-key" }, text("content"))
    const Wrapped = viewComponent<{}>(() => inner)

    expect(classOf(Wrapped({ class: "outer" }))).toBe("outer")
    expect(Wrapped({ class: "outer" }).key).toBe("inner-key")
    // An explicit key from the wrapper wins.
    expect(Wrapped({ class: "outer", key: "outer-key" }).key).toBe("outer-key")
  })

  it("adds classes when the inner element has no class prop", () => {
    expect(renderedClass(undefined, "outer")).toBe("outer")
  })

  it("adds wrapper classes after the inner element's classes", () => {
    expect(renderedClass("inner", "outer")).toBe("outer inner")
    expect(renderedClass("inner extra", "outer")).toBe("outer inner extra")
  })

  it("accepts any ClassProp shape for the wrapper class", () => {
    expect(renderedClass(undefined, ["one", "two"])).toBe("one two")
    expect(renderedClass("inner", { outer: true, hidden: false })).toBe(
      "outer inner",
    )
    expect(
      renderedClass(undefined, [
        "one",
        ["two", { three: true, ignored: false }],
        false,
        undefined,
      ]),
    ).toBe("one two three")
  })

  it("applies key and class together without dropping other inner props", () => {
    const inner = h(
      "div",
      { id: "inner", class: "inner", title: "title" },
      text("content"),
    )
    const Wrapped = viewComponent<{}>(() => inner)

    const vnode = Wrapped({ key: "row-2", class: ["outer", { active: true }] })

    expect(vnode.key).toBe("row-2")
    expect(classOf(vnode)).toBe("outer active inner")
    expect((vnode as ElementVNode<any>).props.id).toBe("inner")
    expect((vnode as ElementVNode<any>).props.title).toBe("title")
  })

  it("does not pass key or class through to the inner component", () => {
    let seen: Record<string, unknown> | undefined
    const Wrapped = viewComponent<{
      id: string
      class?: string
      key?: string
    }>(props => {
      seen = props as Record<string, unknown>
      return h("div", { id: props.id }, text("content"))
    })

    Wrapped({ id: "inner-id", class: "outer", key: "row-3" })

    expect(seen).toEqual({ id: "inner-id" })
    expect(seen && "class" in seen).toBe(false)
    expect(seen && "key" in seen).toBe(false)
  })

  it("passes a text vnode through unchanged, ignoring key and class", () => {
    const inner = text("plain text")
    const Wrapped = viewComponent<{}>(() => inner)

    const vnode = Wrapped({ key: "ignored", class: "ignored" })

    expect(vnode).toBe(inner)
    expect(vnode.key).toBeUndefined()
    expect(vnode.props).toEqual({})
  })

  it("passes nothing through unchanged, ignoring key and class", () => {
    const WrappedNull = viewComponent<{}>(
      () => null as unknown as VNode<any>,
    )
    const WrappedUndefined = viewComponent<{}>(
      () => undefined as unknown as VNode<any>,
    )

    expect(WrappedNull({ key: "ignored", class: "ignored" })).toBeNull()
    expect(
      WrappedUndefined({ key: "ignored", class: "ignored" }),
    ).toBeUndefined()
  })
})

type ClassState = { selected: boolean }

const Toggle: Action<ClassState> = state => ({ selected: !state.selected })

const ClassCard = viewComponent<{
  id: string
  label: string
  innerClass?: ClassProp
}>(props =>
  h(
    "div",
    { id: props.id, class: props.innerClass },
    text(props.label),
  ),
)

const classView = (state: ClassState): ElementVNode<ClassState> =>
  h("div", {}, [
    ClassCard({
      id: "without-inner-class",
      label: "without",
      class: state.selected ? ["outer", "active"] : "outer",
    }),
    ClassCard({
      id: "with-inner-class",
      label: "with",
      innerClass: "inner",
      class: { outer: true, selected: state.selected, hidden: false },
    }),
  ])

describe("viewComponent classes in an app", () => {
  let dispatch: Dispatch<ClassState>
  let node: HTMLElement

  beforeEach(async () => {
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app({ node, init: { selected: false }, view: classView })
    await waitAFrame()
  })

  afterEach(async () => {
    // Let any queued render land before stopping the app, then clear the DOM.
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    node.remove()
  })

  const element = (id: string) =>
    node.querySelector(`#${id}`) as HTMLElement

  it("adds wrapper classes even when the inner element has none", () => {
    expect(classesOf(element("without-inner-class"))).toEqual(["outer"])
  })

  it("merges wrapper classes with the inner element's classes", () => {
    expect(classesOf(element("with-inner-class"))).toEqual(["inner", "outer"])
  })

  it("updates array and object classes on re-render", async () => {
    dispatch(Toggle)
    await waitAFrame()

    expect(getState(dispatch).selected).toBe(true)
    expect(classesOf(element("without-inner-class"))).toEqual([
      "active",
      "outer",
    ])
    expect(classesOf(element("with-inner-class"))).toEqual([
      "inner",
      "outer",
      "selected",
    ])
  })
})

type Item = { id: string; label: string }

type KeyedState = { items: Item[] }

const ReverseItems: Action<KeyedState> = state => ({
  items: [...state.items].reverse(),
})

const RemoveMiddle: Action<KeyedState> = state => ({
  items: state.items.filter(item => item.id !== "b"),
})

const KeyedCard = viewComponent<Item>(props =>
  h("li", { "data-id": props.id }, [
    h("input", { type: "text", "data-item": props.id }),
    text(props.label),
  ]),
)

const keyedView = (state: KeyedState): ElementVNode<KeyedState> =>
  h("div", {}, [
    h(
      "ul",
      {},
      state.items.map(item =>
        KeyedCard({
          ...item,
          key: item.id,
          class: { selected: item.id === "b" },
        }),
      ),
    ),
  ])

describe("viewComponent keys in an app", () => {
  let dispatch: Dispatch<KeyedState>
  let node: HTMLElement

  beforeEach(async () => {
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app({
      node,
      init: {
        items: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
          { id: "c", label: "C" },
        ],
      },
      view: keyedView,
    })
    await waitAFrame()
  })

  afterEach(async () => {
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    node.remove()
  })

  const itemsById = () =>
    new Map(
      Array.from(node.querySelectorAll("li")).map(element => [
        (element as HTMLElement).dataset.id!,
        element as HTMLElement,
      ]),
    )

  it("reorders keyed elements instead of recreating them", async () => {
    const before = itemsById()
    // Expando data lives on the DOM node itself, so it survives patch/move but
    // not the creation of a replacement element.
    for (const [id, element] of before) element.dataset.marker = id

    dispatch(ReverseItems)
    await waitAFrame()

    const after = itemsById()
    expect(Array.from(after.keys())).toEqual(["c", "b", "a"])
    for (const id of ["a", "b", "c"]) {
      expect(after.get(id)).toBe(before.get(id))
      expect(after.get(id)!.dataset.marker).toBe(id)
    }
    // Class merging must not interfere with keys or lose positioning.
    expect(classesOf(after.get("b")!)).toEqual(["selected"])
  })

  it("removes only the keyed element that disappeared", async () => {
    const before = itemsById()

    dispatch(RemoveMiddle)
    await waitAFrame()

    const after = itemsById()
    expect(Array.from(after.keys())).toEqual(["a", "c"])
    expect(after.get("a")).toBe(before.get("a"))
    expect(after.get("c")).toBe(before.get("c"))
  })
})

const TextOnly = viewComponent<{}>(() => text("plain text"))
const Nothing = viewComponent<{}>(() => null as unknown as VNode<any>)

const passThroughView = (): ElementVNode<{}> =>
  h("div", { id: "pass-through" }, [
    TextOnly({ key: "text-key", class: "ignored" }),
    Nothing({ key: "nothing-key", class: "ignored" }),
  ])

describe("viewComponent pass-through nodes in an app", () => {
  let dispatch: Dispatch<{}>
  let node: HTMLElement

  beforeEach(async () => {
    node = document.createElement("div")
    document.body.appendChild(node)
    dispatch = app({ node, init: {}, view: passThroughView })
    await waitAFrame()
  })

  afterEach(async () => {
    await waitAFrame()
    // @ts-expect-error - hyperapp's kill switch: dispatch() with no arguments
    dispatch()
    node.remove()
  })

  it("renders text and nothing without applying key or class", () => {
    // The view's root div patches the mount node itself, so `node` is the root.
    const root = node
    expect(root.id).toBe("pass-through")
    expect(root.textContent).toBe("plain text")
    expect(root.querySelector(".ignored")).toBeNull()
    expect(root.children).toHaveLength(0)
  })
})
