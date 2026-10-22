import type { ValidEventAction, Action } from "./_valid-event-action"
import focuser from "../effects/focuser"

export default <S, X>(
    selector: string,
    action: X & ValidEventAction<S, X>,
  ): Action<S, Event> =>
  (state, event) => [
    state,
    dispatch => dispatch(action, event),
    focuser(selector),
  ]
