module.exports = (function() {
  // https://curiosity-driven.org/private-properties-in-javascript
  const RESULT    = Symbol('result')
  const CALLBACKS = Symbol('callbacks')
  const STATE     = Symbol('state')

  function MyPromise(fn) {
    this[RESULT]    = undefined
    this[CALLBACKS] = []
    this[STATE]     = 'pending'
    const resolve   = (val) => executeLater(() => handle('settled', val))
    const reject    = (val) => executeLater(() => handle('error',   val))
    const invokeCallbacks = () => {
      this[CALLBACKS].forEach(cb => cb())
      this[CALLBACKS] = []
    }
    const ifState = (callbacks) => {
      const retry = () => ifState(callbacks)
      callbacks[this[STATE]] && callbacks[this[STATE]](retry)
    }

    const handle = (settledState, settledValue) => {
      ifState({pending: () => {
        this[STATE]  = settledState
        this[RESULT] = settledValue
        invokeCallbacks()
      }})
    }

    const resolveOrReject = (fn, resolve, reject) => {
      catchErr(reject, () => {
        var nextResult = fn(this[RESULT])
        thenable(nextResult) ? nextResult.then(resolve) : resolve(nextResult)
      })
    }

    const delayedPromise = (fn) =>
      new MyPromise((resolve, reject) => executeLater(() => fn(resolve, reject)))

    this.then = fn => delayedPromise((resolve, reject) => ifState({
      pending: (retry) => this[CALLBACKS].push(retry),
      settled: ()      => resolveOrReject(fn, resolve, reject),
      error:   ()      => reject(this[RESULT]),
    }))

    this.catch = fn => delayedPromise((resolve, reject) => ifState({
      pending: (retry) => this[CALLBACKS].push(retry),
      settled: ()      => resolve(this[RESULT]),
      error:   ()      => resolveOrReject(fn, resolve, reject),
    }))

    catchErr(reject, ()=>fn(resolve, reject))
  }

  MyPromise.reject  = reason => new MyPromise((_, reject) => reject(reason))
  MyPromise.resolve = value  => new MyPromise((resolve, reject) =>
    thenable(value) ? value.then(resolve).catch(reject) : resolve(value)
  )

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

  function catchErr(catchCb, tryCb) {
    try { tryCb() } catch(err) { catchCb(err) }
  }

  return MyPromise
})()
