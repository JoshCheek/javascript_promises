module.exports = MyPromise

function MyPromise(fn) {
  var state     = 'pending'
  var result    = undefined
  var callbacks = []

  function invokeCallbacks() {
    callbacks.forEach(cb => cb())
    callbacks = []
  }

  function ifState(callbacks) {
    const retry = () => ifState(callbacks)
    callbacks[state] && callbacks[state](retry)
  }

  function handle(settledState, settledValue) {
    if(state !== 'pending') return
    state  = settledState
    result = settledValue
    invokeCallbacks()
  }

  function resolveOrReject(fn, resolve, reject) {
    try {
      var nextResult = fn(result)
      if(thenable(nextResult)) nextResult.then(resolve)
      else resolve(nextResult)
    } catch(err) { reject(err) }
  }

  const delayedPromise = (fn) =>
    new MyPromise((resolve, reject) => executeLater(() => fn(resolve, reject)))

  this.then = fn => delayedPromise((resolve, reject) => ifState({
    pending: (retry) => callbacks.push(retry),
    settled: ()      => resolveOrReject(fn, resolve, reject),
    error:   ()      => reject(result),
  }))

  this.catch = fn => delayedPromise((resolve, reject) => ifState({
    pending: (retry) => callbacks.push(retry),
    settled: ()      => resolve(result),
    error:   ()      => resolveOrReject(fn, resolve, reject),
  }))

  const resolve = val => executeLater(() => handle('settled', val))
  const reject  = val => executeLater(() => handle('error',   val))

  try { fn(resolve, reject) }
  catch(err) { reject(err) }
}

MyPromise.reject = function(reason) {
  return new MyPromise((_, reject) => reject(reason))
}

MyPromise.resolve = function(value) {
  return new MyPromise((resolve, reject) =>
    thenable(value) ? value.then(resolve).catch(reject) : resolve(value)
  )
}

MyPromise.all = function(promises) {
  var   resolve      = undefined
  var   reject       = undefined
  var   promisesLeft = promises.length
  const results      = []
  const promiseAll   = new MyPromise((rv, rj) => { resolve = rv, reject = rj })
  promises.forEach((promise, index) => {
    MyPromise.resolve(promise)
             .catch(reject)
             .then(val => results[index] = val)
             .then(_   => --promisesLeft || resolve(results))
  })
  return promiseAll
}

function executeLater(fn) {
  setTimeout(fn, 0)
}

function thenable(value) {
  return value && value.then instanceof Function
}
