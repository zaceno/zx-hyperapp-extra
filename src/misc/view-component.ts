import { h, type ClassProp, type VNode } from "hyperapp"

export default function viewComponent<P, S = any>(
  func: (props: P) => VNode<S>,
): (props: Omit<P, "key" | "class"> & {
  key?: VNode<S>["key"]
  class?: ClassProp
}) => VNode<S> {
  return (props) => {
    const { key, class: klass, ...rest } = props as P & {
      key?: VNode<S>["key"]
      class?: ClassProp
    }
    const vnode = func(rest as P)
    if (vnode.type !== 1) return vnode
    if (key === undefined && klass === undefined) return vnode
    const vnodeProps = vnode.props as { class?: ClassProp }
    return {
      ...vnode,
      key: key ?? vnode.key,
      props:
        klass === undefined
          ? vnodeProps
          : {
              ...vnodeProps,
              class: h("x", { class: [klass, vnodeProps.class] }).props.class,
            },
    }
  }
}
