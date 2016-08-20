module.exports = MyPromise

function MyPromise(fn) {
  this._thenClauses = [];
  const reject = (idk) => console.log("Uhhhh, this is a mistake >.<")
  fn(makeResolver(this), reject)
}

function makeResolver(promise) {
  return invokeOnlyOnce(val => {
    promise._resolvedTo = val
    promise._thenClauses.forEach(fn => fn(val))
  })
}

MyPromise.prototype.then = function(fn) {
  var promise = new MyPromise((resolve, reject) => {
      var invoke = (val) => {
        setTimeout(() => {
          var result = fn(val)
          if(result && result.constructor === MyPromise)
            result.then(val => resolve(val))
          else
            resolve(result)
        }, 0)
    }
    if(this._resolvedTo !== undefined) // TODO: should we be able to resolve to undefined?
      invoke(this._resolvedTo)
    else
      this._thenClauses.push(invoke)
  })
  return promise
}

function invokeOnlyOnce(fn) {
  var invoked = false;
  return function() {
    if(invoked) return
    invoked = true
    return fn.apply(this, Array.prototype.slice.call(arguments))
  }
}
