import { app } from "hyperapp"
import makeStateProviderAndConsumer from "../../src/misc/state-provider-hoa"

type State = {
  foo: string
  bar: string
  baz: string
}

const [appWrapper, withState] = makeStateProviderAndConsumer<State>()

const ChildComponent1 = () => (
  <div class="child1">
    {withState(state => (
      <>{state.foo}</>
    ))}
  </div>
)

const ChildComponent2 = () => (
  <div class="child2">
    {withState(state => (
      <p class={state.bar}>{state.baz}</p>
    ))}
  </div>
)

const Complicated = () => (
  <div class="complicated">
    <ChildComponent1 />
    <ChildComponent2 />
  </div>
)

appWrapper(app)({
  init: { foo: "FOO", bar: "barclass", baz: "BAZ" },
  view: () => (
    <main id="app">
      <h1>Hello</h1>
      <Complicated />
    </main>
  ),
  node: document.getElementById("app")!,
})
