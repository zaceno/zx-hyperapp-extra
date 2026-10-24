import type { app, App, VNode } from "hyperapp"
import makeViewContext from "./view-context"

export default function makeStateProviderAndConsumer<
  S extends Record<string, any>,
>() {
  const [provider, consumer] = makeViewContext<S>()

  const appWrapper = (origApp: typeof app<S>) => (appProps: App<S>) => {
    // App<S> is a union that also allows shapes without view/node, so a bare
    // `appProps.view!` doesn't narrow appProps itself. Assert the shape here.
    const appWithView = appProps as App<S> & {
      view: (state: S) => VNode<S>
      node: Node
    }
    const originalView = appWithView.view
    const newView = (state: S) =>
      provider(state, () => originalView(state)) as VNode<S>
    return origApp({ ...appWithView, view: newView })
  }
  return [appWrapper, consumer] as const
}
