import "./style.css"
import { app, type Action } from "hyperapp"
import islands from "../../src/misc/islands"

type Inventory = { apples: number; bananas: number; oranges: number }

export type State = {
  inventory: Inventory
  selected: keyof Inventory
}
const [central, terminal] = islands<State>(app)
central({
  init: () => ({
    inventory: { apples: 0, bananas: 0, oranges: 0 },
    selected: "apples",
  }),
})

export const SetSelected: Action<State, string> = (state, selected) =>
  !Object.keys(state.inventory).includes(selected)
    ? state
    : {
        ...state,
        selected: selected as keyof Inventory,
      }

export { terminal }
