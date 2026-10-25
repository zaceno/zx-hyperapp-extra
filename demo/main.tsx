import "./style.css"
import { app } from "hyperapp"

type State = { count: number }

app<State>({
  init: { count: 0 },
  view: state => (
    <main id="app">
      <h1>Hyperapp Extra</h1>
      <p>Count: {state.count}</p>
      <p>
        <button onclick={state => ({ count: state.count + 1 })}>
          Click me!
        </button>
      </p>
    </main>
  ),
  node: document.getElementById("app")!,
})
