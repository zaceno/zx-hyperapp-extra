import makeGetStateMw from "./get-state-mw.js"
import makeMockEffectMw from "./mock-effects-mw.js"
import makeMockSubsHof from "./mock-subs-hof.js"
import makeSpyActionMw from "./spy-action-mw.js"

export default (app) => (props) => {
  const { state: getState, mw: getStateMw } = makeGetStateMw()
  const { mock: mockEffect, mw: mockEffectMw } = makeMockEffectMw()
  const { mock: mockSub, wrap: mockSubsWrapper } = makeMockSubsHof()
  const { spy: spyAction, mw: spyActionMw } = makeSpyActionMw()

  const mw = (d) =>
    getStateMw(
      mockEffectMw(spyActionMw(props.dispatch ? props.dispatch(d) : d))
    )
  const subscriptions = props.subscriptions
    ? mockSubsWrapper(props.subscriptions)
    : () => []
  const dispatch = app({
    ...props,
    subscriptions,
    dispatch: mw,
  })

  return { dispatch, getState, mockEffect, mockSub, spyAction }
}
