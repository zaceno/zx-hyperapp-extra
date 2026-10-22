import stateProcessor from "./state-processor.js"
export default ref => [() => ref, stateProcessor(state => (ref = state))]
