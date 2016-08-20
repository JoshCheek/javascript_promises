module.exports = (function() {
  // variables https://curiosity-driven.org/private-properties-in-javascript
  const RESULT    = Symbol('result')
  const CALLBACKS = Symbol('callbacks')
  const STATE     = Symbol('state')

  // functions
  const HANDLE            = Symbol('handle')
  const REJECT            = Symbol('reject')
  const RESOLVE           = Symbol('resolve')
  const IF_STATE          = Symbol('ifState')
  const RESOLVE_OR_REJECT = Symbol('resolveOrReject')

  function MyPromise(fn) {
    this[RESULT]    = undefined
    this[CALLBACKS] = []
    this[STATE]     = 'pending'
    try { fn(this[RESOLVE].bind(this), this[REJECT].bind(this)) }
    catch(err) { this[REJECT](err) }
  }

  MyPromise.prototype = {
    then: function(fn) {
      return delayedPromise((resolve, reject) => this[IF_STATE]({
        pending: (retry) => this[CALLBACKS].push(retry),
        settled: ()      => this[RESOLVE_OR_REJECT](fn, resolve, reject),
        error:   ()      => reject(this[RESULT]),
      }))
    },

    catch: function(fn) {
      return delayedPromise((resolve, reject) => this[IF_STATE]({
        pending: (retry) => this[CALLBACKS].push(retry),
        settled: ()      => resolve(this[RESULT]),
        error:   ()      => this[RESOLVE_OR_REJECT](fn, resolve, reject),
      }))
    },

    [RESOLVE]: function(val) {
      executeLater(() => this[HANDLE]('settled', val))
    },

    [REJECT]:  function(val) {
      executeLater(() => this[HANDLE]('error',   val))
    },

    [RESOLVE_OR_REJECT]: function(fn, resolve, reject) {
      try {
        var nextResult = fn(this[RESULT])
        thenable(nextResult) ? nextResult.then(resolve) : resolve(nextResult)
      } catch(err) {
        reject(err)
      }
    },

    [IF_STATE]: function(callbacks) {
      const retry = () => this[IF_STATE](callbacks)
      callbacks[this[STATE]] && callbacks[this[STATE]](retry)
    },

    [HANDLE]: function(settledState, settledValue) {
      this[IF_STATE]({pending: () => {
        this[STATE]     = settledState
        this[RESULT]    = settledValue
        this[CALLBACKS].forEach(cb => cb())
        this[CALLBACKS] = []
      }})
    }
  }

  MyPromise.reject  = function(reason) {
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

  // helpers

  function executeLater(fn) {
    setTimeout(fn, 0)
  }

  function thenable(value) {
    return value && value.then instanceof Function
  }

  function delayedPromise(fn) {
    return new MyPromise((resolve, reject) => executeLater(() => fn(resolve, reject)))
  }

  return MyPromise
})()
