import { h, type ClassProp, type VNode } from "hyperapp"

export default function viewWrapper<P>(func: (props: P) => VNode<any>): (
  props: Omit<P, "key" | "class"> & {
    key?: string
    class?: ClassProp
  },
) => VNode<any> {
  return props => {
    const {
      key,
      class: klass,
      ...rest
    } = props as P & {
      key?: string
      class?: ClassProp
    }
    const vnode = func(rest as P)
    if (vnode == null || vnode.type === 3) return vnode
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
              "data-key": key ?? "nokey",
            },
    }
  }
}
