import "./style.css"
import { app, type Action } from "hyperapp"
import viewWrapper from "../../src/misc/view-wrapper"

type Color = "red" | "blue"
type ThingType = { uid: string; color: Color }
type State = { things: ThingType[] }

const Thingy = viewWrapper<{ color: Color }>(props => (
  <p class="thingy">{props.color.toUpperCase()}</p>
))

const Reverse: Action<State> = state => ({
  ...state,
  things: [...state.things.reverse()],
})

const MakeRed: Action<State> = state => [
  state,
  () => {
    const thingies = Array.from(document.querySelectorAll(".thingy"))
    for (let thing of thingies) {
      if ((thing as HTMLElement).innerText === "RED") {
        ;(thing as HTMLElement).style.color = "hotpink"
      }
    }
  },
]

app<State>({
  init: {
    things: [
      { uid: "aaa", color: "blue" },
      { uid: "bbb", color: "blue" },
      { uid: "ccc", color: "red" },
      { uid: "ddd", color: "blue" },
    ],
  },
  view: state => (
    <main id="app">
      <h1>Hello</h1>
      <button type="button" onclick={Reverse}>
        REVERSE
      </button>
      <button type="button" onclick={MakeRed}>
        Make Red
      </button>
      {state.things.map(thing => (
        <Thingy
          key={thing.uid}
          class={{ red: thing.color === "red" }}
          color={thing.color}
        />
      ))}
    </main>
  ),
  node: document.getElementById("app")!,
})
