import type { ValidEventAction, Action } from "./_valid-event-action"

export const withKey =
  <S, X>(
    key: string,
    action: X & ValidEventAction<S, X>,
  ): Action<S, KeyboardEvent> =>
  (state, event) => [
    state,
    dispatch => {
      if (event.key === key) {
        event.preventDefault()
        dispatch(action, event)
      }
    },
  ]
