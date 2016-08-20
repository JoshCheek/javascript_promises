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
    state  = newState
    result = newResult
    invokeCallbacks()
  }

  this.then = function(fn) {
    return new MyPromise((resolve, reject) => {
        executeLater(() => {
          callbacks.push(() => {
            if (state === 'settled') {
              var nextResult = fn(result)
              if(nextResult instanceof MyPromise)
                nextResult.then(val => resolve(val))
              else
                resolve(nextResult)
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
          if      ( state === 'settled' ) resolve(result)
          else if ( state === 'error'   ) resolve(fn(result))
        })
        if(state !== 'pending') invokeCallbacks()
      })
    })
  }

  const resolve = invokeOnlyOnce(val => {
    executeLater(() => handle('settled', val))
  })

  const reject = (val) => { // invoke only once?
    executeLater(() => handle('error', val))
  }

  try { fn(resolve, reject) }
  catch(err) { reject(err) }
  finally { /* something probably goes here .done, maybe? */ }
}

function executeLater(fn) {
  setTimeout(fn, 0)
}

function invokeOnlyOnce(fn) {
  var invoked = false;
  return function() {
    if(invoked) return
    invoked = true
    return fn.apply(this, Array.prototype.slice.call(arguments))
  }
}
