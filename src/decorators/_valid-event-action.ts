import { type Action } from "hyperapp"
export type { Action }
export type ValidEventAction<
  S,
  X,
  E extends Event = Event,
> = X extends readonly [Action<S, infer Z>, any]
  ? readonly [Action<S, Z>, Z]
  : X extends [Action<S, infer Z>, any]
  ? [Action<S, Z>, Z]
  : Action<S, E>
