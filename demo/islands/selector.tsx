import type { Action } from "hyperapp"
import { withTargetValue } from "../../src/decorators/with-target-value"
import { terminal, type State } from "./main"

export const SetSelected: Action<State, string> = (state, selected) =>
  !Object.keys(state.inventory).includes(selected)
    ? state
    : {
        ...state,
        selected: selected as keyof State["inventory"],
      }

terminal(document.getElementById("selector")!, state => (
  <select onchange={withTargetValue(SetSelected)}>
    <option value="apples" selected={state.selected === "apples"}>
      Apples
    </option>
    <option value="bananas" selected={state.selected === "bananas"}>
      Bananas
    </option>
    <option value="oranges" selected={state.selected === "oranges"}>
      Oranges
    </option>
  </select>
))
