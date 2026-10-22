import type { Dispatch, Action, Effect } from "hyperapp"

type GetLocalStorageOptions<S> = {
  key: string
  onResult: Action<S, unknown>
  onError?: Action<S, string>
}

const _getLocalStorage = <S>(
  dispatch: Dispatch<S>,
  options: GetLocalStorageOptions<S>,
) => {
  try {
    const str = localStorage.getItem(options.key)
    if (!str) return
    const data = JSON.parse(str)
    dispatch(options.onResult, data)
  } catch (err) {
    if (options.onError) {
      dispatch(
        options.onError,
        err instanceof Error ? err.message : String(err),
      )
    }
  }
}

export default <S>(options: GetLocalStorageOptions<S>) =>
  [_getLocalStorage, options] as Effect<S, GetLocalStorageOptions<S>>
