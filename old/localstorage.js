const debounceRef = {}
const _lspersist = (_, opts) => {
  debounceRef[opts.key] = opts.data
  queueMicrotask(() => {
    if (debounceRef[opts.key] != opts.data) return
    localStorage.setItem(opts.key, JSON.stringify(opts.data))
  })
  return () => {}
}
const _lsload = (disp, opts) => {
  let data = localStorage.getItem(opts.key)
  if (!data) return
  disp(opts.action, JSON.parse(data))
}
export default key => {
  if (typeof localStorage === "undefined") return [() => false, () => false]
  return [
    action => [_lsload, { key, action }],
    data => [_lspersist, { key, data }],
  ]
}
