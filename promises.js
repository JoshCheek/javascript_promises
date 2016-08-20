module.exports = MyPromise

function MyPromise(fn) {
  var state     = 'pending'
  var result    = undefined
  var callbacks = []

  function invokeCallbacks() {
    var toInvoke = callbacks
    callbacks = []
    toInvoke.forEach(cb => cb())
  }

  function handle(settledState, settledValue) {
    if(state !== 'pending') return
    state  = settledState
    result = settledValue
    invokeCallbacks()
  }

  this.then = function(fn) {
    return new MyPromise((resolve, reject) => {
      executeLater(() => {
        callbacks.push(() => {
          if (state === 'settled')
            try { var nextResult = fn(result)
                  if(thenable(nextResult)) nextResult.then(val => resolve(val))
                  else resolve(nextResult)
            } catch(err) { reject(err) }
          else if (state === 'error')
            reject(result)
        })
        if(state !== 'pending') invokeCallbacks()
      })
    })
  }

  this.catch = function(fn) {
    return new MyPromise((resolve, reject) => {
      executeLater(() => {
        callbacks.push(() => {
          if (state === 'settled')
            resolve(result)
          else if (state === 'error')
            try {
              var nextResult = fn(result)
              if(thenable(nextResult)) nextResult.then(val => resolve(val))
              else resolve(nextResult)
            } catch(err) { reject(err) }
        })
        if(state !== 'pending') invokeCallbacks()
      })
    })
  }

  function resolve(val) {
    executeLater(() => handle('settled', val))
  }

  function reject(val) {
    executeLater(() => handle('error', val))
  }

  try { fn(resolve, reject) }
  catch(err) { reject(err) }
  finally { /* something probably goes here .done, maybe? */ }
}

MyPromise.reject = function(reason) {
  return new MyPromise((_, reject) => reject(reason))
}

MyPromise.resolve = function(value) {
  return new MyPromise((resolve, reject) => {
    if(thenable(value))
      value.then(resolve).catch(reject)
    else
      resolve(value)
  })
}

MyPromise.all = function(promises) {
  var   resolve      = undefined
  var   reject       = undefined
  var   promisesLeft = promises.length
  const results      = []
  const promiseAll   = new MyPromise((rv, rj) => { resolve = rv, reject = rj })
  promises.forEach((promise, index) => {
    MyPromise.resolve(promise)
             .catch(val => reject(val))
             .then(val  => results[index] = val)
             .then(_    => --promisesLeft || resolve(results))
  })
  return promiseAll
}

function executeLater(fn) {
  setTimeout(fn, 0)
}

function thenable(value) {
  return value && value.then instanceof Function
}
