import { app, h, text } from "hyperapp"

type State = { count: number }

app<State>({
  init: { count: 0 },
  view: ({ count }) =>
    h("div", {}, [
      h("h1", {}, text("Hyperapp Extra")),
      h("p", {}, text(`Count: ${count}`)),
      h(
        "button",
        { onclick: (state: State) => ({ count: state.count + 1 }) },
        text("Increment"),
      ),
    ]),
  node: document.getElementById("app")!,
})
