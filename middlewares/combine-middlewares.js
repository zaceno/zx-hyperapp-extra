const combine = (a, b, ...c) =>
  c.length ? combine(a, combine(b, ...c)) : d => a(b(d))

export default combine
