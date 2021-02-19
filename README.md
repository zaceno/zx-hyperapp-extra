# Hyperapp Extras

Experimental utilities for Hyperapp.

## Task

A "task" is simply the name we give to a function which takes no arguments and returns a promise. It is a way to represent a side-effectful operation, such as generating a random number. The module `@zxlabs/hyperapp-extras/task` has some useful functions for working with tasks.

#### `run(task, onDone, [onError]) => effect`

This is how you actually perform a task. By passing it to run, along with an `onDone` action, you will get an effect back, which will perform the task and then dispatch `onDone` with the resolved result.

`onDone` is not dispatched in case there was an error. You can optionally provide an `onError` action which will be dispatched with the thrown/rejected value as payload, for handling errors.

#### `define(fn) => task`

Takes a no-argument function, and turns it in to a task. Meaning simply that if `fn` does not return a promise, `define` wraps it so that it does. Throwing errors inside `fn` will cause the returned promise to reject.

#### `succeed(x) => task`

Takes any value, and returns a task which, when performed, will immediately resolve with
the given `x`

#### `fail(e) => task`

Takes any given value and makes a task which, when performed, will immediately reject with the
given value `e`

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

#### `pipe(f,g,h,...) => fn`

If the way to use `andThen` seemed confusing, it is that because it is designed to be easy to use with the pipe-operator `|>`. The previous example could have been written using the pipe operator
as:

```js
const mostlySucceed = val =>
    pickUniform([false, true, true])
    |> andThen(ok => (ok ? succeed(val) : fail(val)))
```

That is especially useful when you need to chain together many steps in a larger operation. However, the pipe-operator does not exist yet in standard javascript (although there is a babel-plugin for it). To hold us over in the mean time, we offer the `pipe` function.

Given three _unary_ functions (functions that take just one argument) `a`, `b`, `c`, stacking them up with `pipe` produces a new unary function `f`:

```js
let f = pipe(a, b, c)

// now

f(x)

//...is exactly equivalent to:

c(b(a(x)))
```

So pipe really has no particular connection to tasks other than it is useful utility in connection with `andThen` and the other task-methods for defining chains of tasks (which are tasks in themselves)

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
