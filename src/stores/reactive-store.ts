export type ReactiveStoreGetterFunc = (depKey: string) => unknown
type CalcFunc = (g: ReactiveStoreGetterFunc) => unknown
type ReactiveStore = Record<
  string,
  {
    dependents: string[]
    value?: unknown
    func?: CalcFunc
  }
>

function recalculate(
  store: ReactiveStore,
  key: string,
  touched?: string[],
): ReactiveStore {
  if (!touched) touched = []
  if (touched.includes(key)) return store
  touched.push(key)
  const cell = store[key]
  const value = cell.func
    ? cell.func((depKey: string) => {
        if (!(depKey in store)) return undefined
        store[depKey].dependents.push(key)
        return store[depKey].value
      })
    : cell.value
  store = { ...store, [key]: { ...cell, value } }
  return cell.dependents
    .filter(key => !touched!.includes(key))
    .reduce((store, key) => recalculate(store, key, touched), store)
}

export const init = () => ({})
export const get = (store: ReactiveStore, key: string) => store[key]?.value
export const set = (store: ReactiveStore, key: string, value: unknown) => {
  const prev = store[key]
  return recalculate(
    {
      ...store,
      [key]: {
        dependents: prev ? prev.dependents : [],
        value: typeof value === "function" ? undefined : value,
        func: typeof value === "function" ? (value as CalcFunc) : undefined,
      },
    },
    key,
  )
}
