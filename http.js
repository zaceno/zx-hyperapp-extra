import { define, succeed, fail, pipe, run, andThen } from "./task.js"

export const task = (url, opts = {}) => define(() => fetch(url, opts))

export const expectStatus = expected => response =>
    response.status === expected ? succeed(response) : fail(response.status)

export const getJSONBody = response => define(() => response.json())

export const getTextBody = response => define(() => response.text())

export const request = opt =>
    run(
        pipe(
            () => task(opt.url, opts.options),
            andThen(response => expectStatus(opt.expectStatus || 200)),
            andThen(response =>
                opt.resolver ? opt.resolver(response) : succeed(null)
            )
        )(),
        opt.onResponse,
        opt.onError
    )

export const get = (url, onResponse, onError) =>
    request({
        url,
        onResponse,
        onError,
        expectStatus: 200,
        resolver: getJSONBody,
    })
