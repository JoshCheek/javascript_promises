module.exports = MyPromise

function MyPromise(fn) {
  this._thenClauses = []
  this._catchBlocks = []
  const resolve = invokeOnlyOnce(val => {
    this._resolvedTo = val
    this._thenClauses.forEach(fn => fn(val))
  })
  const reject  = (idk) => console.log("Uhhhh, this is a mistake >.<")
  try {
    fn(resolve, reject)
  } catch(err) {
    this._errorTo = err;
    this._catchBlocks.forEach(fn => fn(err))
  } finally {
    // something probably goes here .done, maybe?
  }
}

MyPromise.prototype.then = function(fn) {
  var caught = null
  this.catch(err => this.caught = null)
  return new MyPromise((resolve, reject) => {
    var invoke = buildThenInvocation(fn, resolve, reject)
    if(caught)
      raise(caught)
    else if(this._resolvedTo !== undefined) // TODO: should we be able to resolve to undefined?
      invoke(this._resolvedTo)
    else
      this._thenClauses.push(invoke)
  })
}

MyPromise.prototype.catch = function(fn) {
  return new MyPromise((resolve, reject) => {
    var invoke = buildThenInvocation(fn, resolve, reject)
    if(this._errorTo !== undefined) // TODO: should we be able to have an error of undefined?
      invoke(this._errorTo)
    else if(this._resolvedTo !== undefined) // TODO: should we be able to resolve to undefined?
      invoke(this._resolvedTo)
    else
      this._catchBlocks.push(invoke)
  })
}

const executeLater = function(fn) { setTimeout(fn, 0) }

function buildThenInvocation(thenClause, resolve, reject) {
  return (val, err) => {
    executeLater(() => {
      if(err) {
        promise._catchBlocks.forEach(fn => fn(val))
        reject(err)
      } else {
        var result = thenClause(val)
        if(result && result.constructor === MyPromise)
          result.then(val => resolve(val))
        else
          resolve(result)
      }
    })
  }
}

function invokeOnlyOnce(fn) {
  var invoked = false;
  return function() {
    if(invoked) return
    invoked = true
    return fn.apply(this, Array.prototype.slice.call(arguments))
  }
}
