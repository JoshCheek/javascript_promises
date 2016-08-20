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

  function handle(newState, newResult) {
    if(state === 'pending') {
      state  = newState
      result = newResult
      invokeCallbacks()
    }
  }

  this.then = function(fn) {
    return new MyPromise((resolve, reject) => {
        executeLater(() => {
          callbacks.push(() => {
            if (state === 'settled') {
              try {
                var nextResult = fn(result)
                if(nextResult instanceof MyPromise)
                  nextResult.then(val => resolve(val))
                else
                  resolve(nextResult)
              } catch(err) {
                reject(err)
              }
            }
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
          if (state === 'settled') {
            resolve(result)
          }
          else if (state === 'error') {
            try {
              var nextResult = fn(result)
              if(nextResult instanceof MyPromise)
                nextResult.then(val => resolve(val))
              else
                resolve(nextResult)
            } catch(err) {
              reject(err)
            }
          }
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
  return new MyPromise((resolve, reject) => reject(reason))
}

function executeLater(fn) {
  setTimeout(fn, 0)
}
