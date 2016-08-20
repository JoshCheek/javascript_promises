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

  class MyPromise {
    constructor(fn) {
      this[RESULT]    = undefined
      this[CALLBACKS] = []
      this[STATE]     = 'pending'
      try { fn(this[RESOLVE].bind(this), this[REJECT].bind(this)) }
      catch(err) { this[REJECT](err) }
    }

    then(onFulfilled, onRejected) {
      return delayedPromise((resolve, reject) => this[IF_STATE]({
        pending: (retry) => this[CALLBACKS].push(retry),
        settled: ()      => this[RESOLVE_OR_REJECT](onFulfilled,        resolve, reject),
        error:   ()      => this[RESOLVE_OR_REJECT](onRejected||reject, resolve, reject),
      }))
    }

    catch(fn) {
      return delayedPromise((resolve, reject) => this[IF_STATE]({
        pending: (retry) => this[CALLBACKS].push(retry),
        settled: ()      => resolve(this[RESULT]),
        error:   ()      => this[RESOLVE_OR_REJECT](fn, resolve, reject),
      }))
    }

    [RESOLVE](val) {
      invokeLater(() => this[HANDLE]('settled', val))
    }

    [REJECT](val) {
      invokeLater(() => this[HANDLE]('error',   val))
    }

    [RESOLVE_OR_REJECT](fn, resolve, reject) {
      try {
        var nextResult = fn(this[RESULT])
        thenable(nextResult) ? nextResult.then(resolve) : resolve(nextResult)
      } catch(err) {
        reject(err)
      }
    }

    [IF_STATE](callbacks) {
      const retry = () => this[IF_STATE](callbacks)
      callbacks[this[STATE]] && callbacks[this[STATE]](retry)
    }

    [HANDLE](settledState, settledValue) {
      this[IF_STATE]({pending: () => {
        this[STATE]     = settledState
        this[RESULT]    = settledValue
        this[CALLBACKS].forEach(cb => cb())
        this[CALLBACKS] = []
      }})
    }

    static reject(reason) {
      return new MyPromise((_, reject) => reject(reason))
    }

    static resolve(value) {
      return new MyPromise((resolve, reject) =>
        thenable(value) ? value.then(resolve).catch(reject) : resolve(value)
      )
    }

    static all(promises) {
      return new MyPromise((resolve, reject) => {
        var   numLeft = promises.length
        const results = []
        promises.forEach((promise, index) => {
          MyPromise.resolve(promise)
                   .catch(reject)
                   .then(val => results[index] = val)
                   .then(_   => --numLeft || resolve(results))
        })
        numLeft || resolve(results)
      })
    }
  }

  // helpers

  function invokeLater(fn) {
    setTimeout(fn, 0)
  }

  function thenable(value) {
    return value && value.then instanceof Function
  }

  function delayedPromise(fn) {
    return new MyPromise((resolve, reject) => invokeLater(() => fn(resolve, reject)))
  }

  return MyPromise
})()
