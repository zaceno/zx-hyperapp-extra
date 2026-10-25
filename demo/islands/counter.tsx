import { type Action } from "hyperapp"
import { terminal, type State } from "./main"

export const Increment: Action<State> = state => ({
  ...state,
  inventory: {
    ...state.inventory,
    [state.selected]: state.inventory[state.selected] + 1,
  },
})

export const Decrement: Action<State> = state => ({
  ...state,
  inventory: {
    ...state.inventory,
    [state.selected]: state.inventory[state.selected] - 1,
  },
})

terminal(document.getElementById("counter")!, state => (
  <div id="counter">
    <p>{state.selected}:</p>
    <h1>{state.inventory[state.selected]}</h1>
    <p>
      <button onclick={Decrement}>-</button>
      <button onclick={Increment}>+</button>
    </p>
  </div>
))
