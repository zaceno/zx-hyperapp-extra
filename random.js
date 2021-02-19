import {define} from './task.js'

const _randomFloat = (min, max) => Math.random() * (max - min) + min
const _randomInt = (min, max) => Math.floor(_randomFloat(min-1, max)) + 1
const randomFloat = (min, max) => define(() => _randomFloat(min, max))
const randomInt = (min, max) => define(() => _randomInt(min, max))
const pickUniform = (list) => define(() => list[_randomInt(0, list.length - 1)])
const pickWeighted = (list, weights) => define(() => {
  let acc = weights.reduce((a, x, i) => [...a, a[i] + Math.abs(x)], [0]).slice(1)
  let r = _randomInt(0, acc[acc.length - 1] - 1)
  return list[list.length - acc.filter(w => r < w).length]
})
const shuffle = (list) => define(() => {
  let l = [...list]
  for (var i = 0; i < l.length - 2; i++) {
	let j = _randomInt(i, l.length - 1)
	let x = l[i]
	l[i] = l[j]
	l[j] = x
  }
  return l
})
export {randomFloat, randomInt, pickUniform, pickWeighted, shuffle}

