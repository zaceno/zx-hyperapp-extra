let timeout = null

const debounce = (dispatch, { action, time }) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(_ => {
        timeout = null
        dispatch(action)
    }, time)
}

export default (action, time) => [debounce, { action, time }]
