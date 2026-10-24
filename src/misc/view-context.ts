import type { MaybeVNode } from "hyperapp"

type Child = MaybeVNode<any> | MaybeVNode<any>[]
type RenderFunc = () => Child

export default function makeViewContext<P extends Record<string, any>>() {
  let providing: boolean = false
  let context: P = {} as P

  function provider(props: P, render: RenderFunc): Child
  function provider(props: P & { to: RenderFunc }): Child
  function provider(
    props: P | (P & { to: RenderFunc }),
    _render?: RenderFunc,
  ): Child {
    if (providing) return null
    let render: RenderFunc
    if (typeof _render === "function") {
      render = _render
      context = props as P
    } else {
      const { to, ...rest } = props as P & { to: RenderFunc }
      render = to
      context = rest as unknown as P
    }
    providing = true
    const ret = render()
    providing = false
    return ret
  }

  const consumer = (fn: (props: P) => Child): Child => {
    if (!providing) return null
    return fn(context)
  }
  return [provider, consumer] as const
}
