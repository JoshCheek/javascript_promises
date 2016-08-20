module.exports = MyPromise

function MyPromise(fn) {
  var state     = 'pending'
  var result    = undefined
  var callbacks = []

  function invokeCallbacks() {
    callbacks.forEach(cb => cb())
    callbacks = []
  }

  function handle(newState, newResult) {
    state  = newState
    result = newResult
    invokeCallbacks()
  }

  this.then = function(fn) {
    return new Promise((resolve, reject) => {
      callbacks.push(() => {
        if      ( state === 'settled' ) resolve(fn(result))
        else if ( state === 'error'   ) reject(result)
      })
      if(state !== 'pending') invokeCallbacks()
    })
  }

  this.catch = function(fn) {
    return new Promise((resolve, reject) => {
      callbacks.push(() => {
        if      ( state === 'settled' ) resolve(result)
        else if ( state === 'error'   ) resolve(fn(result))
      })
      if(state !== 'pending') invokeCallbacks()
    })
  }

  const resolve = invokeOnlyOnce(val => {
    executeLater(() => handle('settled', val))
  })

  const reject = (val) => { // invoke only once?
    handle('error', val) // execute later?
  }

  try { fn(resolve, reject) }
  catch(err) { reject(err) }
  finally { /* something probably goes here .done, maybe? */ }
}

const executeLater = function(fn) { setTimeout(fn, 0) }

function invokeOnlyOnce(fn) {
  var invoked = false;
  return function() {
    if(invoked) return
    invoked = true
    return fn.apply(this, Array.prototype.slice.call(arguments))
  }
}
