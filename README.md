# Hyperapp Extras

Experimental utilities for Hyperapp.

Some examples:

-   [Search user's posts][http-demo] Shows off using http tasks for chained requests
-   [Memory game][memory-demo] shows how we use a chain of randomness-tasks to produce a memory-game

## Task

A "task" is simply the name we give to a function which takes no arguments and returns a promise. It is a way to represent a side-effectful operation, such as generating a random number. The module `@zxlabs/hyperapp-extras/task` has some useful functions for working with tasks.

#### `run(task, onDone, [onError]) => effect`

This is how you actually perform a task. By passing it to run, along with an `onDone` action, you will get an effect back, which will perform the task and then dispatch `onDone` with the resolved result.

`onDone` is not dispatched in case there was an error. You can optionally provide an `onError` action which will be dispatched with the thrown/rejected value as payload, for handling errors.

#### `andThen(x => nextTask) => prevTask => combinedTask`

`andThen` is the key to the whole task-concept. It allows you to define new tasks as a combination of other tasks.

For example: given a task called `pickUniform` which randomly selects one value from an array, you could define a `mostlySucced` task that is like `succeed` 2/3 of the time, and otherwise like `fail`

```js
const mostlySucceed = val =>
    andThen(ok => (ok ? succeed(val) : fail(val)))(
        pickUniform([false, true, true])
    )
```

Importantly, if the preceeding task failed (doesn't happen in the above example), then `andThen` will never happen.

```js
const aTask = x =>
    andThen(y => {
        /* this will not happen */
    })(fail("foo"))
```

#### `define(fn) => task`

Takes a no-argument function, and turns it in to a task. Meaning simply that if `fn` does not return a promise, `define` wraps it so that it does. Throwing errors inside `fn` will cause the returned promise to reject. You normally don't need this. Usually you will use some library like `@zxlabs/hyperapp-extra/http` or `@zxlabs/hyperapp-extra/random` to create tasks for specific
purposes.

#### `succeed(x) => task`

Takes any value, and returns a task which, when performed, will immediately resolve with
the given `x`

#### `fail(e) => task`

Takes any given value and makes a task which, when performed, will immediately reject with the
given value `e`

#### `pipe(f,g,h,...) => fn`

If the way to use `andThen` seemed confusing, it is that because it is designed to be easy to use with the pipe-operator `|>`. The previous example could have been written using the pipe operator
as:

```js
const mostlySucceed = val =>
    pickUniform([false, true, true])
    |> andThen(ok => (ok ? succeed(val) : fail(val)))
```

That is especially useful when you need to chain together many steps in a larger operation. However, the pipe-operator does not exist yet in standard javascript (although there is a babel-plugin for it). To hold us over in the mean time, we offer the `pipe` and `chain` functions (use one or the other, whichever you prefer – they are just different ways of adressing the same situation).

Given three _unary_ functions (functions that take just one argument) `a`, `b`, `c`, stacking them up with `pipe` produces a new unary function `f`:

```js
let f = pipe(a, b, c)

// now

f(x)

//...is exactly equivalent to:

c(b(a(x)))
```

That means the `mostlySucceed` task could be defined as:

```js
const mostlySucceed = val =>
    pipe(
        () => pickUniform([false, true, true]),
        andThen(ok => (ok ? succeed(val) : fail(val)))
    )()
```

So pipe really has no particular connection to tasks other than it is useful utility in connection with `andThen` and the other task-methods for defining chains of tasks (which are tasks in themselves)

#### `chain(value) => chainer`

`chain` is an eager alternative to pipe, which you might prefer (this is all experimental, after all). Like `pipe` it is not strictly related to tasks, but useful with tasks as an alternative to `|>`

With `|>` you could have:

```js
let a = x => x - 3
let b = x => x * 5
let y = 5 |> a |> b

//y === b(a(5)) === 10
```

With `chain` it works like this:

```js
let a = x => x - 3
let b = x => x * 5
let y = chain(5)._(a)._(b).end

//y === b(a(5)) === 10
```

The `mostlySucceed` definition would be:

```js
const mostlySucceed = val =>
    chain(pickUniform([false, true, true]))._(
        andThen(ok => (ok ? succeed(val) : fail(val)))
    ).end
```

#### `onError(err => nextTask) => prevTask => combinedTask`

`onError` is basically for error-recovery in the chain.

```js
let foo = pipe(
    () => fail("foo"),
    andThen(x => {
        /*
	  this step is
	  skipped  due to the
	  error in previous step
	*/
        return succeed("bar")
    }),
    onError(x => {
        /*
	    this will happen and
		x === 'foo'
	*/
        return succeed(x)
    }),
    andThen(x => {
        /*
		back in business and
		x is 'foo'
	*/
        return succeeds(x)
    })
)
```

#### `map(fn) => prevTask => combinedTask`

`map(someFunc)` is a convenient short-hand instead of `andThen(x => succeed(someFunc(x)))`

#### `mapError(fn) => prevTask => combinedTask`

`mapError(someFunc)` is a convenient short-hand instead of `onError(x => fail(someFunc(x)))`

#### `produceList(length) => task => combinedTask`

Creates a task which when run will _repeat_ the previous steps of a chain/pipe, putting
the results in to an array until the array has the given length.

#### `produceSet(size) => task => combinedTask`

Like the previous, but instead of building a list we build a set. But since sets guarantee
uniqueness it might take more than `size` attempts to complete. It might never be able to
finish. Be careful with this.

## Http

Effect wrappers to `fetch` to allow you to make http-calls (what the ancient ones referred to as
"ajax") from your Hyperapp actions. Some tasks so you can combine complex operations of multiple requests and data-processing in a single effect. Also some basic effects for when you just need to fire off a single, simple request.

#### task(url, options) => Task

The `url` and `options` are the same arguments you would pass to `fetch`. Returns a task that will return the promise of `fetch(url, options)` when performed. Simple as that.

#### expectStatus(statusCode) => response => Task

Use it in a chain with fetch to ensure that the status code matches the expectation (fails with unexpected status code).

```js
const getSmth = Task.pipe(
    url => Http.task(url),
    Task.andThen(Http.expectStatus(200)),
    Task.onError(code => {
        if (code !== 403) return Task.fail(code)
        return pipe(
            () => sendCredentials,
            Task.andThen(ok => getSmth(url))
        )()
    })
)
```

#### getJSONBody(response) => Task

Task that parses response body as JSON

```js
const getData = Task.pipe(
	url => Http.task(url),
	Task.andThen(Http.checkStatus(200)),
	Task.andThen(Http.getJSONBody)
	Task.andThen(data => {
		/*
			here, data is plain
			javascript object
		*/
	})
)

```

#### getTextBody(response) => Task

Task that parses response body as text

```js
const getData = Task.pipe(
    url => Http.task(url),
    Task.andThen(Http.checkStatus(200)),
    Task.andThen(response =>
        Task.pipe(
            () => Http.getJSONBody(response),
            onError(() => Http.getTextBody(response))
        )()
    ),
    Task.andThen(data => {
        /*
			If the body was json-parseable
			it is now data, otherwise
			the body was parsed as a string
		*/
    })
)
```

#### get(url, OnOk, [OnFail]) => Effect

A simple effect for when all you want is to call a URL to get some JSON data.

#### request({url, [options], [expectStatus=200], [resolver], [OnOk], [OnFail]})

The full power of `fetch` as a single effect. For when you want to do something more
complex with headers and whatnot, but you don't need to chain multiple requests
together so using Http.task is overkill.

-   `url, options` are the arguments `fetch` normally takes.
-   `expectStatus` is the status code we expect from the response (it is a failure if the
    status is not the expected)
-   `resolver` is for if you want data back from the response. Use `Http.getJSONBody` or `Http.getTextBody`. (Technically, you can use any `response => task` function where the task will produce the result you care about from the response.)
-   `OnOk` action which if given is dispatched when request is done. Payload will be the result of the resolver or null if no resolver.
-   `OnFail` action which if given is dispatched in case the request failed in any of the steps
    (request, check status, resolver). The error thrown is given as payload

## Random

Provides tasks for randomness operations

#### `randomFloat(min, max) => task`

Produces a random float from `min` (inclusive) to `max` (exclusive)

#### `randomInt(min, max) => task`

Produces a random int from `min` (inclusive) to `max` (inclusive)

#### `pickUniform(list) => task`

Produces a random value selected from the the given list (array).
Each element has equal chance of being picked.

#### `pickWeighted(list, weights) => task`

Produces a randomly selected value from `list`, but the probability of each element is
determined by the relative _weight_ given at the corresponding index in the _weights_ list

```js
pickWeighted(["a, b, c"], [3, 1, 2])

// is equivalent to:

pickUniform(["a", "a", "a", "b", "c", "c"])
```

#### `shuffle(list) => task`

A task which produces a shuffled copy of the given list.

## Debounce

An effect which dispatches an action after the given delay in milliseconds. But, repeated attempts to use debounce within the timeout will cancel previously scheduled dispatches. Useful
for preventing expensive things like hitting the network from happening too frequently.

```js
import debounce from "@zxlabs/hyperapp-extras/debounce"

/* ... */

const HandleInput = (state, input) => [
    { ...state, input },
    debounce([Fetch, input], 500),
]
```

[http-demo]: https://flems.io/#0=N4IgzgxgTg9gNnEAuA2gBgDRoLoZAMwEs4BTMZFUAOwEMBbE5EAOgAsAXOxPCGK9kvyYAeACaEAbgAJCogLwAdEDQAOKpQD5hAenESNCqsNZQp2g0ZUaAajTiypAVzAlTtBmCk0oJJFJ1Whv6OcBZS4f72GgBCPuw6UUERwlEAgvx8JOwCCYRhyVEAyvQ0-Kw0ufnhKXkA0t6EpVQklUnVUfV0PkbaiVQRkXkAMiQwKvCiMAD6AMIwUADWrgCerf0FeQCicADuy1TMhQvEZGsDNRoAsjQAHoQMUwByhIIwO2cbGgAiJHAqrIRmh92nlLvNGqxDuxSuw+B8dCELMJAusvjRoVIAGT0FQAbikqQACgBJKS8RxQARgZZSGD4JLCGhSEwkfCKEAcdgqMBIbTaABWYD4KjgNAgJFYE1czHYyxUhF4ohIzF4dG0mjazOy3N5AqFVBFYolUqgMrlCpgSpVMDVDO0NCR2isIDwLlIEHYhD45CQIAAjABmJBoEAAXww1HojF9zEFLpAvH4gnYTHu40pUmAqhUoak+FgdCkAHJOTq+Y4DQsAObWtWsOWubNFwxp+bsLVcPMF4ulnnlys11XaesqVz2djNqitjNKgBGMAr4q7Np72r72grKmrte0AAEAF43UWzsDDhtQbMAWhIN3YF90JHni5Ik+n7YAVF5PAAJbXLwslmuuqbtuQ4HkeNAnmeo4Xmo163vepavnQ6Yfl+UgACr-quXLriBg42nuh7HqeI6NnBN53jQ2jQmACyToYiZgO2qiEAA4lkABShQAPKPFIciYcw8qjgAFJqNwCRoUi-lyMo0HRomAbhuqCsKoripKcBKqasryoqypDkW4QANRSDcACUGCahhzClKIGGsIIomySozA3qOHqFNC7DOKJABMaBoBZVk2XZVAOU5VAudqzBVlxvGPNElrLKF6zhLZdCqJsUCwFAokkFJmZMfAypwDAVZKZsABK1U8dVRYYFIJAWficQUv0RYuFAEgKoVrh5UWoYWUkI1UIYjHeu28XsISMDMWAABi8wAKrde4hWCbZIkkOJ6zOK4G1FaxHHsNxfFKQdUBgAA-FdG1yMZZn3VGaUZeFkXOVdnhyFUTjdWAzCkFQVbsKwmo3UJYCOBA4okKIonfeg2DMLIY0DH4tn4DQxBKVQMBSNDECsP9rhFujUhvUJ9mOV93UOL9Xjyqd52PEp4wLXd3XEvIT2k1AaNU5lqiiRz7A-dJYuA2A9jiqJmBSAArCFhhjZNVDMVIhRZMSBqOO2gmicx6IkE1gIqPrFlFZQzC28bAhm3r7DhlIc4LlQcuLVkxNNYrQUWdgE0e1NUhe+wxMCVIRs+S11tJMAUi28w9um4TPnOH4Keo07UiQ0W+DewCIPGX4RayKQxnhkkWfm-rWKYkJUAVntAwzXNC3LVAa2HVG0cm9nFvsFT4R9w7UhS1bjOicAScp01UtNfbGfFqI6I0ENw9R3Pafos4k-SdPs8x4v6dgMNo1SIYgfjTfTHtjshBgxh3gzbYcCOJtXgel6-RT9vJASGTPvKQKAxSej4E1AByZ5JQBmswCQdgP7X0MNmaeSRASPz8MAWu7BS6NXHvNcWfgqAhDgCfXePJizlxfFXdYvUSA7EzjHIqHAuAAANNTCCyoCP65wcGagGOEPSJB2QCFvEoARgi+A4LkAAEmAA-J+L8shvw-qJbW7BdaDwsqGSRAwEHvxEfImuTtdHpUEeYSR8jL7mIGFnJeP05CCTLqICuucOxwDYciDQGEGxeH5kdSCMBAFSFhHmQuoSnKEFMFLAIGgOG2IiEw-uDiBJOOLAXcORcqzGUhqwzxYhJBklFGAMA7Jyo0B0koMw8S9FSGSQIZOp80nOO6r1JcA15i5I8V4qwtMfBSB2ApLw-ROlQDiQkwRSSd6NNSU45x+NCYwxJldbp+Tek+KcgMwgnhFlXUGY-EmYN0RSA2hMupfh1l1OqIiYxMdhKEMBllFQotCEsM4AUqI8ixYykfqQUMlQ2E6IRKESZgizHnG0Nwqg8TrLrHxkqPwkwICOAYPwOKWRtgkDRewaIyweZKSbGNYa8ZVTylIFAZAJCECul+CQb+3omAAHYkAADYAxhgjCADaTAVSlNJXwAQQgYwVJ0nCoGMBKmuCQDQfAAhTDACSPOKAOlLwXnEMvP2ABSXESQH6iDBn4P0aBsW6vWFEqsHAjUmroGasxEqpUKqSFlWBgJrUqEkjQfWMAzXhHwIKy8YBCD7l8FIY1HrfUEKDeAqgfgfCik9IAyNYj2CXkBEqfgfhLwAE5c3ZtNUq+YqrYQqCNcwP02LCbwAcLA2cNB5ZNQVk28trVC0qtcGqwglrcFhvLZWoU9hRBSFrfWptjbG3MGCpG5Vqr5zZBtGWithYB01qrHWhtUgx2bpbdOotHbSBysXf26tQ6ADE+AL2XsjZeHYj5jipqohrf1UA6B+EfTLE2AAteWrb1iXjoGAS877n2vtCReDWCaSDfqnUkYD8xQPvsg9B394Qb13sfpeUo9x0Q-z8KKgAHL2v0nhARECnAIKQ9hmjeEjVhrKMa8OStEIRv05aSNUDI4-QqVGSA0cMGY3caHZz3svEsZY+YoyeAI5mJIaAtUyfMUJkTcGX1xpgDHeWSoqwoYiCp0DsANNoC0zpiFYagrycVYp29wmMN6bUxpgMrKjMkG05GoR4GwAgfsybUSjnnOuaSGYgTYmJMeEo0xwjlnwhyYUwMJTtmPNeeHepnz-mdPudKJ5+D3mBCaZcyZpIxqYtRYiPFh9iXsvJYc054zbmwOZaSwZnzfnauBf44YeMbp6Uxp9P6P0SAAxMrDNgUMQA
[memory-demo]: https://flems.io/#0=N4IgzgxgTg9gNnEAuA2gBgDRoLoZAMwEs4BTMZFUAOwEMBbE5EAOgAsAXOxPCGK9kvyYAeACaEAbgAJCogLwAdEDQAOKpQD5hAenESNCqiDxgSpCO0J9ySEAEYkaEAF8M1eo1vMAVuR58BIVtCOhUYKHYpYClVFSlnKXxYOiklDnYVMCRtbQhRKmYwAGsATxUaCCLmURIJbVYykihYpUMQsIipDi5E5NSQdMzs3PzC0vLK6tr6xqg4QnZWqnbwyJqAIxgAVyoIEl6YFKUAAQAvAA84GnWwGZUm2IBaEnP2Zt0STZ29pZXOgCoYmApAAlA5HEBnS7XW4Ne7NNTPV7vZpUUSHX6hVZSQE0YEAFXB-ShVxudweiJebxo2nYeKKS0MvCoYEiAHEQQBJAAiAH0AMqcgBaAFEpHIpABmKQ5MD3CCEfAlLo0OD4KTsVj7UhUADmmqkMHVNCkYFk+yNGq1Ul1UFkhiZ1kiusEDwE-JKdE2cGBEvxzAgrBohCoAAoUIYpFHoygAJwAdgATAAODBSWPJ5MAFlwkejUbjGYArGm7Gg0PG7LmqFHsABKPPMXmh1Eu30aKQoVtkNPdsDMOiqUPhughtOD8718UdidSR5SUdUOv1xvN8N9tMAdxIhF1HDAU7kHZBzBUhEqAHUd3uBKIWzQ9T2pNvd-u6w2a1Im6H-Q-RPitTDEcxwXGhJzradQWYVF0ToTl+FDRdxzA98Pyjb9-RUWBRC2PZ+RIdhQw5HkBWFMVAWIvlBVFHEpETd9Vx-Ach1MSIj07ZhONYtNOMKAj6zQr9m1-NEAMEUMwE9b12ygsBWC2fB8FICSpPgMBUMbQRRAdXYnSkQMdiKcUpFDeZWTTJdIOAPMo1ISIDKoIpfU7bAbMScITLsmRjLQABubzhCkMz2GYHV9VYfzCCkABqCVLIcpzTy2OTTMIVlCnmPZQ0INMouiqQl0EqMoAIrYoBrBKwEMZwdOZVlTTpdhkoAWVUYzQwgGgoFEMA03wSyjzczruv7QcVA6rrREg0NrM-fN0M44bRAwNz81ZGgmqyRIwyWusVrm+IGKoR0WUiJTCBUAA5Kl2qW3qZDRF4IMGg71s21rxrutMlunVboyW5gQxqc5xTkCUgZeP75qkAB+foJDSwh1lIJZoehpB9MmwpGuS0GJSUBGzWRkhUbR-M4bSWQamOkAofmjGAbe5K3I-E76vOlQAFU4glCaRtyx7zmegxXpxsAPr5nrvsm6aAYhkGwfBwXYfhxHiaUKQGaxpn1NZ3TTtNAjWvYQMSCm3mvoe4HhbcnWJctn6XrJuXlcVq3IYOsmKZAQcTa1bTac9tGte67GNtxt2CbVlHA7J8n+l902A7p-MQ9EMPNpZ2q9LSzl2AACSpwRbsm+75eFzGRpQeXsAziOwf6Vgi5p7ODZddgADVo-2CU7sgu7mCIOABCgDr+7r30G6jomY71urIi6kh8U3GAu5nnvK56yD27XpHlLuutQsEcK8bo1v6vRMg8+NwMS-592hastyvOkCUd+7yX1LcxUTIkI+9QNAAQgbnYCCJUmrlUSKqUwblwFlRrBIdAtdJJengKfO61dBbINUnAaq59IgADF5g8xMm9EgAtrZPwOj-UMgDc4F2bhJRqJAAylwoU9MBpVIFkO-uqUMi9l6rw-mQ1hI0jpkzgZA2acdoy8TIftGRUY7oYw5tdV4TCNosMtuXBRaMarUL4ZfMA18NqBg0QIURUsH7iLRpImsEYg7Q2iHI5h0sRoY1Yjff25itFsOsfEXRMiNjbF2CQUMABhUgXUvFmzTPGcse06auQOnYqIX4uKuM3ltDm3MfGWLLoLCC+j9Fs0iJEkg0TTH+2MmQ6a0jZEZM0YErJHixYSxEQ7GWTs0aMzFqfJQid-Ya29rqPgJMQCa03hPFm+1nBzz0myGA7APSoJ9O1eRpocHqTqUNUuHitnMXGipVZ7DH7sRmnTFB3pmn5nljc6MOsMaU1ENTJQzS5mJKoHM-BUh+R0giGyDw7UK4OPzNEZRBUtgIACW5f0UAdihhdFQN0JAVnSTTIs5ZWyPzJMMLEC51DljsAxn8rq7BAUMGaQjEgm5WmaMgt0OAAADKQwhBwhhFmTAAJMADppcpAADIBV0wSnky2lFSI0UBPRQ5oYU7RlgJuBlnBmXyuhmISQ+krhgDAIoEAS1HiKs0GquOPLFWypNYozeyquBMstVa6MGqJD2odfNCA2rdU8vqa6n1brJoYzeFschLrfXzUJnvEgSAQ2hp6drPpkcQDhvVhMgAPim6NMa-Whx1v0n2VSzZvIzTG0ZyK04T1zSW8Z9zM16P0TWq1fB3XniKHIHlKAiEXTcenGudb63Q05X201wA-l2j1IPZI4SgxQHCTAGoktCg4LrL2wdjrdCSAHX2u1jiHVLpDToPQG645brJru7dwh1hbHYOwPghpdiZRbTy0lAKPDOA0CCMg-z2A6AvVevgh6dDsqoBoJlzSqCzsjVIdEEAtgMH4MwduIpSCwfYAAIRKJyO8SgWggE+d8ow-hQjECaMgKgUK4AmDMCQCwVgWRMDsFmJAWZEwuDcCAWgDAmABh1cYfVARBDsCYICWaChIhSHKC8kMuoMZ+QdKJwcUBdQhmk75WTJSQoGsVVEWTUZNyyE1BjJMaAVDnBU8ddganLFabM1GcQcorglAxiGeYyLHjIxgJUUzImoz4ACI8M0pwIMADYjMme00FEMJBHhalfMSqQyYQuedE7p0Q+m4sJbC9Fm8GN4vGcS1GGAEgmhKRgLSrozc8tSE2N1JoGM7DGcq1cSopp4CyAq1VmoUBDU0HEMlbLuWwsCFeI8VUu4qAM3400Cr8nFNjakFmfr1nnxNwEH5iYEGwObgRBVwb7BHgQ34LV8sABSNrFQii2hCaIR4vA4DhAxgAYljFmGTZmLMAyTaQKzXmNRUj249A7UgXvffWGdi7Owrs3bu1Ie7il8CJbU7Jyx8GxlfdE0m4gCwHNlZeYIeHPHTDmEsNYJgiZYxIGY84bAzggA
