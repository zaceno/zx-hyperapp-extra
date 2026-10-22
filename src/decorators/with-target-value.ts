import type { Action } from "./_valid-event-action"

export const withTargetValue =
  <S>(action: Action<S, string>): Action<S, Event> =>
  (_, event) => [action, (event.target as HTMLInputElement).value]
