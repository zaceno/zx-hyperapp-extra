import type { app, Dispatch, Dispatchable, Subscription, VNode } from "hyperapp"

type App<S> = typeof app<S>

type Middleware<S> = (dispatch: Dispatch<S>) => Dispatch<S>

const makeSyncMiddleware = <S>(stateRef: { state: S }): Middleware<S> => {
  const syncedSet: Dispatch<S>[] = []
  return dispatch => {
    syncedSet.push(dispatch)
    return <P>(action: Dispatchable<S>, payload?: P) => {
      const news = Array.isArray(action) ? action[0] : action
      if (
        typeof news !== "function" &&
        !Array.isArray(news) &&
        stateRef.state !== news &&
        news != null
      ) {
        stateRef.state = news as S // needed because the Array.isArray doesnt narrow type to S
        syncedSet.forEach(d => d(news))
      }
      dispatch(action, payload)
    }
  }
}

const makeCentral =
  <S>(originalApp: App<S>, syncmw: Middleware<S>) =>
  (props: {
    init: Dispatchable<S>
    subscriptions?: (
      state: S,
    ) => readonly (boolean | undefined | Subscription<S>)[]
    dispatch?: (dispatch: Dispatch<S>) => Dispatch<S>
  }) =>
    originalApp({
      ...props,
      dispatch: (d: Dispatch<S>) =>
        syncmw(props.dispatch ? props.dispatch(d) : d),
    })

const makeTerminal =
  <S>(originalApp: App<S>, stateRef: { state: S }, syncmw: Middleware<S>) =>
  (node: Node, view: (state: S) => VNode<S>) =>
    originalApp({
      node,
      view,
      dispatch: syncmw,
      init: stateRef.state,
    })

export default function <S>(originalApp: typeof app<S>) {
  const stateRef = { state: {} as S }
  const syncmw = makeSyncMiddleware(stateRef)
  const central = makeCentral(originalApp, syncmw)
  const terminal = makeTerminal(originalApp, stateRef, syncmw)
  return [central, terminal] as const
}
