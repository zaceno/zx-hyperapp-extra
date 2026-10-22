import type { Action, ValidEventAction } from "./_valid-event-action"
export const withPreventDefault =
  <S, X, E extends Event = Event>(
    action: X & ValidEventAction<S, X>,
  ): Action<S, E> =>
  (state, event) => {
    event.preventDefault()
    return [state, dispatch => dispatch(action, event)]
  }
