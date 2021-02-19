const _run = (dispatch, { onOk, onFail, task }) =>
    task()
        .then(x => onOk && dispatch(onOk, x))
        .catch(x => onFail && dispatch(onFail, x))

export const run = (task, onOk, onFail) => [_run, { task, onOk, onFail }]
export const define = fn => async () => Promise.resolve(fn())
export const andThen = taskmap => prev => () => prev().then(x => taskmap(x)())
export const onError = taskmap => prev => () => prev().catch(x => taskmap(x)())
export const succeed = x => define(() => x)
export const fail = x => define(() => Promise.reject(x))
export const map = resultmap => andThen(x => succeed(resultmap(x)))
export const mapError = resultmap => onError(x => fail(resultmap(x)))

export const pipe = (...stuff) => x => stuff.reduce((y, f) => f(y), x)
export const chain = x => ({ _: f => chain(f(x)), end: x })
const producer = (init, cont, add) => task => async () => {
    let a = init()
    while (cont(a)) {
        let x = await task()
        add(a, x)
    }
    return a
}

export const produceList = n =>
    producer(
        () => [],
        l => l.length < n,
        (l, x) => l.push(x)
    )
export const produceSet = n =>
    producer(
        () => new Set(),
        s => s.size < n,
        (s, x) => s.add(x)
    )
