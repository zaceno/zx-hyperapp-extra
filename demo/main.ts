import { app, h, text } from "hyperapp"
import { setDocumentTitle } from "../src/effects/set-document-title"

type State = { count: number }

app<State>({
  init: [{ count: 0 }, [setDocumentTitle, "Hyperapp Extra demo"]],
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
