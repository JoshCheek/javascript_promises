module.exports = MyPromise

function MyPromise(fn) {
  var state     = 'pending'
  var result    = undefined
  var callbacks = []

  this.then = function(fn) {
    return new Promise((resolve, reject) => {
      var invoke = () => {
        if (state === 'settled') resolve(fn(result))
        else if (state === 'error') reject(result)
      }
      if(state !== 'pending') invoke()
      else callbacks.push(invoke)
    })
  }

  this.catch = function(fn) {
    return new Promise((resolve, reject) => {
      var invoke = () => {
        if (state === 'error') resolve(fn(result))
        else if (state === 'settled') resolve(result)
      }
      if(state !== 'pending') invoke()
      else callbacks.push(invoke)
    })
  }

  function invokeCallbacks() {
    callbacks.forEach(cb => cb())
    callbacks = "You should not have gotten this far"
  }

  const resolve = invokeOnlyOnce(val => {
    executeLater(() => {
      state  = 'settled'
      result = val
      invokeCallbacks()
    })
  })

  const reject = (val) => { // invoke only once?
    // execute later?
    state  = 'error'
    result = val
    invokeCallbacks()
  }

  try {
    fn(resolve, reject)
  } catch(err) {
    reject(err)
  } finally {
    // something probably goes here .done, maybe?
  }
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
