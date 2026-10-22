import type { ValidEventAction } from "./_valid-event-action"
import { withKey } from "./with-key"
export const withEnterKey = <S, X>(action: X & ValidEventAction<S, X>) =>
  withKey("Enter", action)
