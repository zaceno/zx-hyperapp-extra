import { terminal } from "./main"

terminal(document.getElementById("inventory")!, state => (
  <div id="invenory">
    <p>Apples: {state.inventory["apples"]}</p>
    <p>Bananas: {state.inventory["bananas"]}</p>
    <p>Oranges: {state.inventory["oranges"]}</p>
  </div>
))
