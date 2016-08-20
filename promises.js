module.exports = MyPromise

function MyPromise(fn) {
  this._thenClauses = [];
  const reject = (idk) => console.log("Uhhhh, this is a mistake >.<")
  fn(makeResolver(this), reject)
}

MyPromise.prototype.then = function(fn) {
  return new MyPromise((resolve, reject) => {
    var invoke = invokeThenClause(fn, resolve, reject)
    if(this._resolvedTo !== undefined) // TODO: should we be able to resolve to undefined?
      invoke(this._resolvedTo)
    else
      this._thenClauses.push(invoke)
  })
}

function makeResolver(promise) {
  return invokeOnlyOnce(val => {
    promise._resolvedTo = val
    promise._thenClauses.forEach(fn => fn(val))
  })
}

const executeLater = function(fn) { setTimeout(fn, 0) }

function invokeThenClause(thenClause, resolve, reject) {
  return (val) => executeLater(() => {
                    var result = thenClause(val)
                    if(result && result.constructor === MyPromise)
                      result.then(val => resolve(val))
                    else
                      resolve(result)
                  })
}

function invokeOnlyOnce(fn) {
  var invoked = false;
  return function() {
    if(invoked) return
    invoked = true
    return fn.apply(this, Array.prototype.slice.call(arguments))
  }
}
